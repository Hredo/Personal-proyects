import Link from 'next/link';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import { PaymentModal } from '@/components/PaymentModal';

export default async function ClientInvoicesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const client: any = db.prepare(`SELECT * FROM clients WHERE userId = ?`).get(session.user.id);
  if (!client) redirect('/client-portal');

  const invoices: any[] = db.prepare(`
    SELECT * FROM invoices
    WHERE clientId = ?
    ORDER BY createdAt DESC
  `).all(client.id) as any[];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.6rem' }}>Facturas</h1>
        <Link href="/client-portal" className="btn" style={{ textDecoration: 'none', border: '1px solid var(--border)', background: 'white' }}>
          Volver al portal
        </Link>
      </div>

      <div className="glass-card" style={{ background: 'white', padding: '1rem' }}>
        {invoices.length === 0 ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '1.5rem' }}>No tienes facturas asociadas.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '0.6rem 0.4rem' }}>Factura</th>
                <th style={{ padding: '0.6rem 0.4rem' }}>Importe</th>
                <th style={{ padding: '0.6rem 0.4rem' }}>Vencimiento</th>
                <th style={{ padding: '0.6rem 0.4rem' }}>Estado</th>
                <th style={{ padding: '0.6rem 0.4rem' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => {
                const paid = invoice.status === 'PAID';
                const overdue = invoice.status === 'OVERDUE';

                return (
                  <tr key={invoice.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '0.8rem 0.4rem', fontWeight: 700 }}>#{invoice.id.substring(0, 12)}</td>
                    <td style={{ padding: '0.8rem 0.4rem' }}>{Number(invoice.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</td>
                    <td style={{ padding: '0.8rem 0.4rem' }}>{new Date(invoice.dueDate).toLocaleDateString('es-ES')}</td>
                    <td style={{ padding: '0.8rem 0.4rem' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '999px',
                        fontWeight: 700,
                        background: paid ? '#dcfce7' : overdue ? '#fee2e2' : '#ffedd5',
                        color: paid ? '#166534' : overdue ? '#991b1b' : '#9a3412'
                      }}>
                        {paid ? 'Pagada' : overdue ? 'Vencida' : 'Pendiente'}
                      </span>
                    </td>
                    <td style={{ padding: '0.8rem 0.4rem' }}>
                      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                        <Link href={`/client-portal/invoices/${invoice.id}`} style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}>
                          Ver
                        </Link>
                        {!paid && <PaymentModal invoiceId={invoice.id} amount={Number(invoice.amount)} />}
                      </div>
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
