import Link from 'next/link';
import db from '@/lib/db';
import { addInvoiceItem } from '@/lib/actions';
import { InvoiceStatusButton } from '@/components/BillingActions';

type Params = { id: string };

export default async function InvoiceDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;

  const invoice: any = db.prepare(`
    SELECT i.*, u.name as clientName, u.email as clientEmail, c.phone as clientPhone, c.address as clientAddress
    FROM invoices i
    JOIN clients c ON i.clientId = c.id
    JOIN users u ON c.userId = u.id
    WHERE i.id = ?
  `).get(id);

  if (!invoice) {
    return (
      <div className="glass-card" style={{ background: 'white', padding: '2rem' }}>
        <h1 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Factura no encontrada</h1>
        <Link href="/dashboard/billing" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>
          Volver a facturación
        </Link>
      </div>
    );
  }

  const items: any[] = db.prepare(`
    SELECT * FROM invoice_items
    WHERE invoiceId = ?
    ORDER BY createdAt DESC
  `).all(id) as any[];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.7rem' }}>Factura #{invoice.id.substring(0, 12)}</h1>
          <p style={{ color: '#64748b' }}>{invoice.clientName} · {invoice.clientEmail}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/dashboard/billing" className="btn" style={{ background: 'white', border: '1px solid var(--border)', textDecoration: 'none' }}>
            Volver
          </Link>
          <InvoiceStatusButton invoiceId={invoice.id} currentStatus={invoice.status} />
        </div>
      </div>

      <div className="glass-card" style={{ background: 'white', padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Consulta</p>
            <p style={{ fontWeight: 700 }}>{invoice.consultationNumber || 'Sin consulta'}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Vencimiento</p>
            <p style={{ fontWeight: 700 }}>{new Date(invoice.dueDate).toLocaleDateString('es-ES')}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Creación</p>
            <p style={{ fontWeight: 700 }}>{new Date(invoice.createdAt).toLocaleDateString('es-ES')}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total</p>
            <p style={{ fontWeight: 800, fontSize: '1.2rem' }}>{Number(invoice.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', alignItems: 'start' }}>
        <div className="glass-card" style={{ background: 'white', padding: '1.25rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.8rem' }}>Líneas de factura</h2>
          {items.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No hay líneas registradas.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem' }}>Descripción</th>
                  <th style={{ padding: '0.5rem' }}>Cant.</th>
                  <th style={{ padding: '0.5rem' }}>Unidad</th>
                  <th style={{ padding: '0.5rem' }}>Precio</th>
                  <th style={{ padding: '0.5rem' }}>Importe</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.55rem 0.5rem' }}>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.description}</p>
                      {item.notes && <p style={{ color: '#64748b', fontSize: '0.78rem' }}>{item.notes}</p>}
                    </td>
                    <td style={{ padding: '0.55rem 0.5rem' }}>{Number(item.quantity)}</td>
                    <td style={{ padding: '0.55rem 0.5rem' }}>{item.unit}</td>
                    <td style={{ padding: '0.55rem 0.5rem' }}>{Number(item.unitPrice).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</td>
                    <td style={{ padding: '0.55rem 0.5rem', fontWeight: 700 }}>{Number(item.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="glass-card" style={{ background: 'white', padding: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '0.8rem' }}>Añadir línea</h2>
          <form
            action={async (formData) => {
              'use server';
              await addInvoiceItem(formData);
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
          >
            <input type="hidden" name="invoiceId" value={invoice.id} />
            <input name="description" required placeholder="Descripción" style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <input name="quantity" type="number" min="0.01" step="0.01" required placeholder="Cantidad" style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} />
              <input name="unit" required placeholder="Unidad" defaultValue="servicio" style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} />
            </div>
            <input name="unitPrice" type="number" min="0.01" step="0.01" required placeholder="Precio unitario" style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} />
            <textarea name="notes" rows={3} placeholder="Notas internas" style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border)', resize: 'vertical' }} />
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Agregar elemento</button>
          </form>

          <div style={{ marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.8rem' }}>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.2rem' }}>Contacto del cliente</p>
            <p style={{ fontSize: '0.85rem' }}>{invoice.clientPhone || 'Sin teléfono'}</p>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>{invoice.clientAddress || 'Sin dirección'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
