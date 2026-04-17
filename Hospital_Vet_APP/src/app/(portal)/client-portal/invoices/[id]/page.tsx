import Link from 'next/link';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import { PaymentModal } from '@/components/PaymentModal';

type Params = { id: string };

export default async function ClientInvoiceDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) redirect('/login');

  const invoice: any = db.prepare(`
    SELECT i.*, c.userId, u.name as clientName
    FROM invoices i
    JOIN clients c ON i.clientId = c.id
    JOIN users u ON c.userId = u.id
    WHERE i.id = ?
  `).get(id);

  if (!invoice || invoice.userId !== session.user.id) {
    redirect('/client-portal/invoices');
  }

  const items: any[] = db.prepare(`
    SELECT * FROM invoice_items
    WHERE invoiceId = ?
    ORDER BY createdAt DESC
  `).all(id) as any[];

  const paid = invoice.status === 'PAID';
  const overdue = invoice.status === 'OVERDUE';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem' }}>Factura #{invoice.id.substring(0, 12)}</h1>
          <p style={{ color: '#64748b' }}>{invoice.clientName}</p>
        </div>
        <Link href="/client-portal/invoices" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>
          Volver
        </Link>
      </div>

      <div className="glass-card" style={{ background: 'white', padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div>
            <p style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Estado</p>
            <p style={{ fontWeight: 700, color: paid ? '#166534' : overdue ? '#991b1b' : '#9a3412' }}>
              {paid ? 'Pagada' : overdue ? 'Vencida' : 'Pendiente'}
            </p>
          </div>
          <div>
            <p style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Fecha</p>
            <p style={{ fontWeight: 700 }}>{new Date(invoice.createdAt).toLocaleDateString('es-ES')}</p>
          </div>
          <div>
            <p style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Vencimiento</p>
            <p style={{ fontWeight: 700 }}>{new Date(invoice.dueDate).toLocaleDateString('es-ES')}</p>
          </div>
          <div>
            <p style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Total</p>
            <p style={{ fontWeight: 800, fontSize: '1.15rem' }}>{Number(invoice.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ background: 'white', padding: '1rem' }}>
        <h2 style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>Detalle de conceptos</h2>
        {items.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>Esta factura no tiene líneas detalladas.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem' }}>Descripción</th>
                <th style={{ padding: '0.5rem' }}>Cant.</th>
                <th style={{ padding: '0.5rem' }}>Precio</th>
                <th style={{ padding: '0.5rem' }}>Importe</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '0.55rem 0.5rem' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.description}</p>
                    {item.notes && <p style={{ color: '#64748b', fontSize: '0.78rem' }}>{item.notes}</p>}
                  </td>
                  <td style={{ padding: '0.55rem 0.5rem' }}>{Number(item.quantity)} {item.unit}</td>
                  <td style={{ padding: '0.55rem 0.5rem' }}>{Number(item.unitPrice).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</td>
                  <td style={{ padding: '0.55rem 0.5rem', fontWeight: 700 }}>{Number(item.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!paid && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <PaymentModal invoiceId={invoice.id} amount={Number(invoice.amount)} />
        </div>
      )}
    </div>
  );
}
