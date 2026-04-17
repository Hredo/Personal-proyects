import db from './db';
import { format } from 'date-fns';

/**
 * Fiscal & Accounting System
 * Tax reporting, invoice compliance, and financial reconciliation
 */

export interface InvoiceSequence {
  id: string;
  clinicId: string;
  year: number;
  prefix: string; // E.g., "FAC", "REC"
  currentNumber: number;
  format: string; // E.g., "{prefix}-{year}-{number:05d}"
}

export interface TaxReport {
  id: string;
  clinicId: string;
  period: string; // YYYY-MM
  totalRevenue: number;
  totalTax: number;
  taxableIncome: number;
  transactions: number;
  generatedAt: string;
  status: 'DRAFT' | 'READY' | 'FILED' | 'APPROVED';
}

/**
 * Initialize fiscal schema
 */
export function initFiscalSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoice_sequences (
      id TEXT PRIMARY KEY,
      clinicId TEXT NOT NULL,
      year INTEGER NOT NULL,
      prefix TEXT NOT NULL,
      currentNumber INTEGER DEFAULT 0,
      format TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clinicId) REFERENCES clinics(id) ON DELETE CASCADE,
      UNIQUE(clinicId, year, prefix)
    );

    CREATE TABLE IF NOT EXISTS tax_reports (
      id TEXT PRIMARY KEY,
      clinicId TEXT NOT NULL,
      period TEXT NOT NULL,
      totalRevenue REAL NOT NULL CHECK (totalRevenue >= 0),
      totalTax REAL NOT NULL CHECK (totalTax >= 0),
      taxableIncome REAL NOT NULL,
      transactions INTEGER NOT NULL,
      status TEXT DEFAULT 'DRAFT',
      generatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      filedAt DATETIME,
      notes TEXT,
      FOREIGN KEY (clinicId) REFERENCES clinics(id) ON DELETE CASCADE,
      UNIQUE(clinicId, period)
    );

    CREATE TABLE IF NOT EXISTS payment_reconciliation (
      id TEXT PRIMARY KEY,
      clinicId TEXT NOT NULL,
      invoiceId TEXT NOT NULL,
      amount REAL NOT NULL CHECK (amount >= 0),
      method TEXT NOT NULL, -- CASH, CARD, TRANSFER, CHECK
      reference TEXT,
      reconciliationDate DATETIME,
      status TEXT DEFAULT 'PENDING', -- PENDING, RECONCILED, DISPUTED
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clinicId) REFERENCES clinics(id) ON DELETE CASCADE,
      FOREIGN KEY (invoiceId) REFERENCES invoices(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_invoiceSeq_clinic_year ON invoice_sequences(clinicId, year);
    CREATE INDEX IF NOT EXISTS idx_taxReports_clinic_period ON tax_reports(clinicId, period);
    CREATE INDEX IF NOT EXISTS idx_paymentRecon_clinic_date ON payment_reconciliation(clinicId, reconciliationDate);
  `);
}

/**
 * Generate next invoice number
 */
export function getNextInvoiceNumber(clinicId: string, prefix = 'FAC'): string {
  try {
    const year = new Date().getFullYear();
    
    // Get or create sequence
    let seq = db.prepare(
      'SELECT * FROM invoice_sequences WHERE clinicId = ? AND year = ? AND prefix = ?'
    ).get(clinicId, year, prefix) as any;

    if (!seq) {
      // Create sequence
      const id = `seq_${clinicId}_${year}_${prefix}`;
      db.prepare(`
        INSERT INTO invoice_sequences (id, clinicId, year, prefix, format)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        id,
        clinicId,
        year,
        prefix,
        `${prefix}-${year}-{number:05d}`
      );
      seq = { currentNumber: 0, prefix, year };
    }

    // Increment and generate number
    const nextNum = seq.currentNumber + 1;
    db.prepare(
      'UPDATE invoice_sequences SET currentNumber = ? WHERE id = ?'
    ).run(nextNum, seq.id);

    // Format: FAC-2025-00001
    return `${prefix}-${year}-${String(nextNum).padStart(5, '0')}`;
  } catch (error) {
    console.error('Failed to generate invoice number:', error);
    throw new Error('Invoice numbering failed');
  }
}

/**
 * Generate tax report for period
 */
export function generateTaxReport(clinicId: string, period: string): TaxReport {
  try {
    // period format: "2025-03" for March 2025
    const [year, month] = period.split('-');
    const startDate = new Date(`${year}-${month}-01`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    // Calculate totals
    const invoiceData = db.prepare(`
      SELECT 
        COUNT(*) as transactionCount,
        SUM(amount) as totalRevenue,
        SUM(amount * 0.21) as estimatedTax -- 21% VAT for Spain
      FROM invoices 
      WHERE clinicId = ? AND status = 'PAID'
      AND createdAt >= ? AND createdAt < ?
    `).get(
      clinicId,
      startDate.toISOString(),
      endDate.toISOString()
    ) as any;

    const totalRevenue = invoiceData.totalRevenue || 0;
    const totalTax = invoiceData.estimatedTax || 0;
    const taxableIncome = totalRevenue - totalTax; // Simplified for demo
    const transactionCount = invoiceData.transactionCount || 0;

    // Create or update tax report
    const reportId = `taxreport_${clinicId}_${period}`;
    const existing = db.prepare(
      'SELECT id FROM tax_reports WHERE clinicId = ? AND period = ?'
    ).get(clinicId, period) as any;

    if (existing) {
      db.prepare(`
        UPDATE tax_reports 
        SET totalRevenue = ?, totalTax = ?, taxableIncome = ?, transactions = ?, status = 'DRAFT'
        WHERE id = ?
      `).run(totalRevenue, totalTax, taxableIncome, transactionCount, existing.id);

      return {
        id: existing.id,
        clinicId,
        period,
        totalRevenue,
        totalTax,
        taxableIncome,
        transactions: transactionCount,
        generatedAt: new Date().toISOString(),
        status: 'DRAFT',
      };
    } else {
      db.prepare(`
        INSERT INTO tax_reports (id, clinicId, period, totalRevenue, totalTax, taxableIncome, transactions)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(reportId, clinicId, period, totalRevenue, totalTax, taxableIncome, transactionCount);

      return {
        id: reportId,
        clinicId,
        period,
        totalRevenue,
        totalTax,
        taxableIncome,
        transactions: transactionCount,
        generatedAt: new Date().toISOString(),
        status: 'DRAFT',
      };
    }
  } catch (error) {
    console.error('Failed to generate tax report:', error);
    throw new Error('Tax report generation failed');
  }
}

/**
 * Get financial summary
 */
export function getFinancialSummary(clinicId: string, months = 12) {
  try {
    const summaries = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const period = format(date, 'yyyy-MM');

      const data = db.prepare(`
        SELECT 
          COUNT(*) as invoiceCount,
          SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END) as paidAmount,
          SUM(CASE WHEN status = 'PENDING' THEN amount ELSE 0 END) as pendingAmount,
          SUM(amount) as totalAmount
        FROM invoices 
        WHERE clinicId = ? 
        AND strftime('%Y-%m', createdAt) = ?
      `).get(clinicId, period) as any;

      summaries.push({
        period,
        invoices: data.invoiceCount || 0,
        paid: data.paidAmount || 0,
        pending: data.pendingAmount || 0,
        total: data.totalAmount || 0,
      });
    }

    return summaries;
  } catch (error) {
    console.error('Failed to get financial summary:', error);
    return [];
  }
}

/**
 * Record payment reconciliation
 */
export function recordPaymentReconciliation(
  clinicId: string,
  invoiceId: string,
  amount: number,
  method: string,
  reference?: string
): boolean {
  try {
    const id = `reconcile_${Date.now()}`;
    db.prepare(`
      INSERT INTO payment_reconciliation (id, clinicId, invoiceId, amount, method, reference)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, clinicId, invoiceId, amount, method, reference || null);

    return true;
  } catch (error) {
    console.error('Failed to record reconciliation:', error);
    return false;
  }
}

/**
 * Get outstanding invoices
 */
export function getOutstandingInvoices(clinicId: string) {
  try {
    const stmt = db.prepare(`
      SELECT i.*, c.name as clientName
      FROM invoices i
      JOIN clients c ON i.clientId = c.id
      WHERE i.clinicId = ? AND i.status = 'PENDING'
      AND i.dueDate < CURRENT_TIMESTAMP
      ORDER BY i.dueDate ASC
    `);

    return stmt.all(clinicId) as any[];
  } catch (error) {
    console.error('Failed to get outstanding invoices:', error);
    return [];
  }
}

/**
 * Generate invoice PDF or JSON
 */
export function generateInvoiceDocument(invoiceId: string, format: 'json' | 'html' = 'json'): any {
  try {
    const invoice = db.prepare(`
      SELECT i.*, c.name as clientName, c.phone as clientPhone, c.address as clientAddress
      FROM invoices i
      JOIN clients c ON i.clientId = c.id
      WHERE i.id = ?
    `).get(invoiceId) as any;

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const items = db.prepare(`
      SELECT * FROM invoice_items WHERE invoiceId = ?
    `).all(invoiceId) as any[];

    const document = {
      invoiceId: invoice.id,
      invoiceNumber: invoice.consultationNumber,
      date: invoice.createdAt,
      dueDate: invoice.dueDate,
      client: {
        name: invoice.clientName,
        phone: invoice.clientPhone,
        address: invoice.clientAddress,
      },
      items,
      subtotal: items.reduce((sum, item) => sum + item.amount, 0),
      tax: items.reduce((sum, item) => sum + item.amount * 0.21, 0), // 21% VAT
      total: invoice.amount,
      status: invoice.status,
      notes: 'Gracias por elegir nuestra clínica veterinaria. This invoice is valid for 30 days.',
    };

    if (format === 'html') {
      return generateInvoiceHTML(document);
    }

    return document;
  } catch (error) {
    console.error('Failed to generate invoice document:', error);
    throw new Error('Invoice generation failed');
  }
}

/**
 * Generate simple HTML invoice for printing
 */
function generateInvoiceHTML(doc: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Factura ${doc.invoiceNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
        .section { margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .total-row { font-weight: bold; background-color: #f9f9f9; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>FACTURA</h1>
        <p><strong>Número:</strong> ${doc.invoiceNumber}</p>
        <p><strong>Fecha:</strong> ${new Date(doc.date).toLocaleDateString('es-ES')}</p>
        <p><strong>Vencimiento:</strong> ${new Date(doc.dueDate).toLocaleDateString('es-ES')}</p>
      </div>

      <div class="section">
        <h3>Cliente</h3>
        <p><strong>${doc.client.name}</strong></p>
        <p>${doc.client.address}</p>
        <p>${doc.client.phone}</p>
      </div>

      <div class="section">
        <table>
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Cantidad</th>
              <th>Precio Unitario</th>
              <th>Importe</th>
            </tr>
          </thead>
          <tbody>
            ${doc.items.map((item: any) => `
              <tr>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>€${item.unitPrice.toFixed(2)}</td>
                <td>€${item.amount.toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="3">Subtotal</td>
              <td>€${doc.subtotal.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="3">IVA (21%)</td>
              <td>€${doc.tax.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="3">TOTAL</td>
              <td>€${doc.total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p>${doc.notes}</p>
      </div>
    </body>
    </html>
  `;
}

// Initialize on module load
try {
  initFiscalSchema();
} catch (error) {
  console.error('Failed to initialize fiscal schema:', error);
}

export default {
  getNextInvoiceNumber,
  generateTaxReport,
  getFinancialSummary,
  recordPaymentReconciliation,
  getOutstandingInvoices,
  generateInvoiceDocument,
};
