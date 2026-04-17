'use client';

import { useActionState, useState } from 'react';
import { createInvoice, updateInvoiceStatus } from '@/lib/actions';
import Modal from '@/components/Modal';
import { Plus } from 'lucide-react';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.8rem', borderRadius: '0.5rem',
  border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem', fontFamily: 'inherit'
};
const labelStyle: React.CSSProperties = { fontSize: '0.8rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.3rem' };
const fieldStyle: React.CSSProperties = { marginBottom: '1rem' };

export function NewInvoiceButton({ clients }: { clients: { id: string; userName: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState(createInvoice, null);

  // Default due date: 30 days from now
  const defaultDue = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        <Plus size={18} style={{ marginRight: '0.5rem' }} />
        Crear Nueva Factura
      </button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Crear Nueva Factura">
        {state?.success && <p style={{ color: '#166534', background: '#dcfce7', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>✓ {state.success}</p>}
        {state?.error && <p style={{ color: '#991b1b', background: '#fee2e2', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>⚠ {state.error}</p>}
        <form action={action}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Cliente *</label>
            <select name="clientId" required style={inputStyle}>
              <option value="">Seleccionar cliente...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.userName}</option>)}
            </select>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Nº de Consulta (opcional)</label>
            <input name="consultationNumber" style={inputStyle} placeholder="Ej: CONS-2026-0001" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Importe (€) *</label>
            <input name="amount" type="number" step="0.01" min="0.01" required style={inputStyle} placeholder="0.00" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Fecha de Vencimiento *</label>
            <input name="dueDate" type="date" required defaultValue={defaultDue} style={inputStyle} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Descripción / Concepto</label>
            <textarea name="description" rows={3} style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="Ej: Consulta + cirugía + hospitalización 3 días..." />
          </div>
          <button type="submit" disabled={isPending} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            {isPending ? 'Creando factura...' : 'Crear Factura'}
          </button>
        </form>
      </Modal>
    </>
  );
}

export function InvoiceStatusButton({ invoiceId, currentStatus }: { invoiceId: string; currentStatus: string }) {
  const [open, setOpen] = useState(false);
  const statuses = [
    { value: 'PENDING', label: 'Pendiente', bg: '#ffedd5', color: '#9a3412' },
    { value: 'PAID', label: 'Pagado', bg: '#dcfce7', color: '#166534' },
    { value: 'OVERDUE', label: 'Vencido', bg: '#fee2e2', color: '#991b1b' },
  ];
  const current = statuses.find(s => s.value === currentStatus);

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '2rem', fontWeight: '600',
        background: current?.bg || '#f1f5f9', color: current?.color || '#374151',
        border: 'none', cursor: 'pointer'
      }}>
        {current?.label || currentStatus}
      </button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Cambiar Estado de Factura" width="340px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {statuses.map(s => (
            <form key={s.value} action={async (formData) => { await updateInvoiceStatus(formData); }}>
              <input type="hidden" name="id" value={invoiceId} />
              <input type="hidden" name="status" value={s.value} />
              <button type="submit" onClick={() => setOpen(false)} style={{
                width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                border: `2px solid ${s.value === currentStatus ? s.color : '#e2e8f0'}`,
                background: s.value === currentStatus ? s.bg : 'white', color: s.color,
                fontWeight: s.value === currentStatus ? '700' : '500',
                cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', fontFamily: 'inherit'
              }}>
                {s.value === currentStatus ? '✓ ' : ''}{s.label}
              </button>
            </form>
          ))}
        </div>
      </Modal>
    </>
  );
}
