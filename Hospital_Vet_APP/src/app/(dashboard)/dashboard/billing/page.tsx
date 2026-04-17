import Link from 'next/link';
import db from '@/lib/db';
import { DollarSign, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { NewInvoiceButton, InvoiceStatusButton } from '@/components/BillingActions';

type InvoiceItem = {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  notes?: string | null;
  createdAt: string;
};

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;

  const clients: any[] = db.prepare(`
    SELECT c.id, u.name as userName FROM clients c JOIN users u ON c.userId = u.id ORDER BY u.name
  `).all();

  let invoices: any[] = db.prepare(`
    SELECT i.*, u.name as clientName
    FROM invoices i
    JOIN clients c ON i.clientId = c.id
    JOIN users u ON c.userId = u.id
    ORDER BY i.createdAt DESC
  `).all();

  const invoiceItems = db.prepare(`
    SELECT ii.*, i.consultationNumber
    FROM invoice_items ii
    JOIN invoices i ON i.id = ii.invoiceId
    ORDER BY ii.createdAt DESC
  `).all() as InvoiceItem[];

  const itemsByInvoice = invoiceItems.reduce((acc, item) => {
    if (!acc[item.invoiceId]) acc[item.invoiceId] = [];
    acc[item.invoiceId].push(item);
    return acc;
  }, {} as Record<string, InvoiceItem[]>);

  const allInvoices = invoices;

  if (status && status !== 'ALL') {
    invoices = invoices.filter(i => i.status === status);
  }

  const totalRevenue = allInvoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.amount, 0);
  const pending = allInvoices.filter(i => i.status === 'PENDING').reduce((s, i) => s + i.amount, 0);
  const overdue = allInvoices.filter(i => i.status === 'OVERDUE').reduce((s, i) => s + i.amount, 0);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRevenue = allInvoices.filter(i => i.status === 'PAID' && i.createdAt?.startsWith(todayStr)).reduce((s, i) => s + i.amount, 0);

  const statusDisplay: Record<string, { bg: string; color: string; label: string }> = {
    PAID:    { bg: '#dcfce7', color: '#166534', label: 'Pagado' },
    PENDING: { bg: '#ffedd5', color: '#9a3412', label: 'Pendiente' },
    OVERDUE: { bg: '#fee2e2', color: '#991b1b', label: 'Vencido' },
  };

  const filterButtons = [
    { value: '', label: 'Todas' },
    { value: 'PAID', label: 'Pagadas' },
    { value: 'PENDING', label: 'Pendientes' },
    { value: 'OVERDUE', label: 'Vencidas' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem' }}>Facturación & Cobros</h1>
          <p style={{ color: '#64748b' }}>Gestión de facturas, pagos y deudas.</p>
        </div>
        <NewInvoiceButton clients={clients} />
      </header>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        {[
          { icon: <TrendingUp size={20} color="#166534" />, label: 'Ingresos Totales', value: `${totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`, bg: 'white' },
          { icon: <DollarSign size={20} color="var(--primary)" />, label: 'Cobrado Hoy', value: `${todayRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`, bg: 'white' },
          { icon: <Clock size={20} color="#9a3412" />, label: 'Pendiente de Cobro', value: `${pending.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`, bg: '#fffbeb' },
          { icon: <AlertCircle size={20} color="#991b1b" />, label: 'Facturas Vencidas', value: `${overdue.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`, bg: '#fef2f2' },
        ].map((kpi, i) => (
          <div key={i} className="glass-card" style={{ background: kpi.bg, padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {kpi.icon}
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{kpi.label}</p>
            </div>
            <h3 style={{ fontSize: '1.4rem' }}>{kpi.value}</h3>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {filterButtons.map(fb => (
          <a key={fb.value} href={fb.value ? `/dashboard/billing?status=${fb.value}` : '/dashboard/billing'}
            className="btn"
            style={{
              background: (status === fb.value || (!status && !fb.value)) ? 'var(--primary)' : 'white',
              color: (status === fb.value || (!status && !fb.value)) ? 'white' : '#374151',
              border: '1px solid var(--border)', textDecoration: 'none', padding: '0.4rem 1rem', fontSize: '0.85rem'
            }}>
            {fb.label}
          </a>
        ))}
        <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: '0.85rem', lineHeight: '2.5' }}>
          {invoices.length} factura{invoices.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Invoices table */}
      <div className="glass-card" style={{ background: 'white', padding: '1.5rem' }}>
        {invoices.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>No hay facturas {status ? 'con este estado' : ''}.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                {['Nº FACTURA', 'CONSULTA', 'CLIENTE', 'DESGLOSE', 'IMPORTE', 'VENCIMIENTO', 'FECHA', 'ESTADO', 'GESTIÓN'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 0.5rem', color: '#64748b', fontWeight: '500', fontSize: '0.8rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => {
                const st = statusDisplay[inv.status] || { bg: '#f1f5f9', color: '#374151', label: inv.status };
                const isOverdue = inv.status === 'PENDING' && inv.dueDate && new Date(inv.dueDate) < new Date();
                const detailedItems = itemsByInvoice[inv.id] || [];
                return (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: '700', fontFamily: 'monospace', color: 'var(--primary)' }}>#{inv.id.substring(0, 12)}</p>
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.45rem', borderRadius: '999px', background: '#ecfeff', color: '#0f766e', fontWeight: '700' }}>
                        {inv.consultationNumber || 'Sin consulta'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 0.5rem', fontSize: '0.85rem', fontWeight: '500' }}>{inv.clientName}</td>
                    <td style={{ padding: '1rem 0.5rem', fontSize: '0.8rem', color: '#64748b', maxWidth: '200px' }}>
                      {detailedItems.length > 0 ? (
                        <details>
                          <summary style={{ cursor: 'pointer', fontWeight: '700', color: '#334155' }}>Ver {detailedItems.length} línea(s)</summary>
                          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {detailedItems.map((line: InvoiceItem) => (
                              <div key={line.id} style={{ background: '#f8fafc', borderRadius: '0.4rem', padding: '0.35rem 0.45rem' }}>
                                <p style={{ fontSize: '0.74rem', color: '#0f172a', fontWeight: '700' }}>{line.description}</p>
                                <p style={{ fontSize: '0.7rem', color: '#64748b' }}>{Number(line.quantity)} {line.unit} x {Number(line.unitPrice).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
                                {line.notes && <p style={{ fontSize: '0.68rem', color: '#64748b' }}>Notas: {line.notes}</p>}
                                <p style={{ fontSize: '0.66rem', color: '#94a3b8' }}>{new Date(line.createdAt).toLocaleString('es-ES')}</p>
                              </div>
                            ))}
                          </div>
                        </details>
                      ) : (
                        inv.items ? String(inv.items).substring(0, 60) + (String(inv.items).length > 60 ? '...' : '') : '—'
                      )}
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <p style={{ fontSize: '0.95rem', fontWeight: '700' }}>{Number(inv.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      {inv.dueDate ? (
                        <p style={{ fontSize: '0.8rem', color: isOverdue ? '#ef4444' : '#64748b', fontWeight: isOverdue ? '600' : '400' }}>
                          {isOverdue ? '⚠ ' : ''}{new Date(inv.dueDate).toLocaleDateString('es-ES')}
                        </p>
                      ) : <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>—</span>}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                      {new Date(inv.createdAt).toLocaleDateString('es-ES')}
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <InvoiceStatusButton invoiceId={inv.id} currentStatus={inv.status} />
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <Link href={`/dashboard/billing/${inv.id}`} style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', fontSize: '0.85rem' }}>
                        Ver factura
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
