import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import { getFinancialSummary, getOutstandingInvoices } from '@/lib/accounting';

export default async function FinancialReports() {
  const session = await auth();
  
  if (!session?.user || !['ADMIN', 'VETERINARIAN', 'STAFF'].includes(session.user.role)) {
    redirect('/login');
  }

  // Get financial data for last 12 months
  const summary = getFinancialSummary('clinic_default', 12);
  const outstanding = getOutstandingInvoices('clinic_default');

  // Calculate metrics
  const totalRevenue = summary.reduce((sum, m) => sum + m.paid, 0);
  const totalPending = summary.reduce((sum, m) => sum + m.pending, 0);
  const avgInvoice = summary.reduce((sum, m) => sum + m.total, 0) / (summary.length || 1);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>📊 Reportes Financieros</h1>

      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: '#d4edda', padding: '1.5rem', borderRadius: '0.75rem' }}>
          <div style={{ fontSize: '0.9rem', color: '#155724' }}>Ingresos Totales</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0b5345' }}>
            €{totalRevenue.toFixed(2)}
          </div>
        </div>
        <div style={{ background: '#fff3cd', padding: '1.5rem', borderRadius: '0.75rem' }}>
          <div style={{ fontSize: '0.9rem', color: '#856404' }}>En Pendiente</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#664d03' }}>
            €{totalPending.toFixed(2)}
          </div>
        </div>
        <div style={{ background: '#d6d8db', padding: '1.5rem', borderRadius: '0.75rem' }}>
          <div style={{ fontSize: '0.9rem', color: '#383d41' }}>Promedio por Factura</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#202122' }}>
            €{avgInvoice.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Monthly Summary */}
      <section style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '2rem', border: '1px solid #e0e0e0' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>📈 Resumen Mensual (últimos 12 meses)</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Mes</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Facturas</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Pagado</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Pendiente</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((month, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.75rem' }}>
                    {new Date(month.period + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>{month.invoices}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#10b981' }}>
                    €{month.paid.toFixed(2)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#f59e0b' }}>
                    €{month.pending.toFixed(2)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold' }}>
                    €{month.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Outstanding Invoices */}
      {outstanding.length > 0 && (
        <section style={{ background: '#fff3cd', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #ffc107' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#856404' }}>⚠️ Facturas Vencidas ({outstanding.length})</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#ffffff', borderBottom: '2px solid #ffc107' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Cliente</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Factura</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Importe</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Vencimiento</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Días Atraso</th>
                </tr>
              </thead>
              <tbody>
                {outstanding.map((inv, idx) => {
                  const daysOverdue = Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #ffe8a1' }}>
                      <td style={{ padding: '0.75rem' }}>{inv.clientName}</td>
                      <td style={{ padding: '0.75rem' }}>{inv.id.slice(0, 12)}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold' }}>
                        €{inv.amount.toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {new Date(inv.dueDate).toLocaleDateString('es-ES')}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', color: '#d32f2f', fontWeight: 'bold' }}>
                        +{daysOverdue} días
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
