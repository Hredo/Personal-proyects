'use client';

import { useActionState, useState } from 'react';
import { createInventoryItem, updateInventory, deleteInventoryItem } from '@/lib/actions';
import Modal from '@/components/Modal';
import { Plus, Trash2, Edit3 } from 'lucide-react';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.8rem', borderRadius: '0.5rem',
  border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem', fontFamily: 'inherit'
};
const labelStyle: React.CSSProperties = { fontSize: '0.8rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.3rem' };
const fieldStyle: React.CSSProperties = { marginBottom: '1rem' };

export function NewInventoryItemButton() {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState(createInventoryItem, null);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        <Plus size={18} style={{ marginRight: '0.5rem' }} />
        Nuevo Artículo
      </button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Añadir Artículo al Inventario">
        {state?.success && <p style={{ color: '#166534', background: '#dcfce7', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>✓ {state.success}</p>}
        {state?.error && <p style={{ color: '#991b1b', background: '#fee2e2', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>⚠ {state.error}</p>}
        <form action={action}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Nombre *</label>
            <input name="name" required style={inputStyle} placeholder="Ej: Amoxicilina 250mg" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Categoría *</label>
              <select name="category" required style={inputStyle}>
                <option value="">Seleccionar...</option>
                {['Medicación','Anestesia','Antiparasitario','Vacuna','Consumibles','Diagnóstico','Desinfectante','Nutrición','Equipamiento'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Unidad *</label>
              <input name="unit" required style={inputStyle} placeholder="Ej: tabletas, viales..." />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Cantidad Inicial</label>
              <input name="quantity" type="number" min="0" defaultValue="0" style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Stock Mínimo</label>
              <input name="minStock" type="number" min="0" defaultValue="10" style={inputStyle} />
            </div>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Ubicación</label>
            <input name="location" style={inputStyle} placeholder="Ej: Farmacia A, Almacén 1..." />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Fecha de Caducidad</label>
            <input name="expiryDate" type="date" style={inputStyle} />
          </div>
          <button type="submit" disabled={isPending} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            {isPending ? 'Guardando...' : 'Añadir Artículo'}
          </button>
        </form>
      </Modal>
    </>
  );
}

export function InventoryQuantityEditor({ itemId, currentQty, unit }: { itemId: string; currentQty: number; unit: string }) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(currentQty);

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn" style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem', border: '1px solid #e2e8f0' }}>
        <Edit3 size={14} style={{ marginRight: '0.25rem' }} />
        Gestionar
      </button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Actualizar Stock" width="380px">
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Stock actual: <strong>{currentQty} {unit}</strong></p>
        <form action={updateInventory}>
          <input type="hidden" name="id" value={itemId} />
          <div style={fieldStyle}>
            <label style={labelStyle}>Nueva cantidad ({unit})</label>
            <input
              name="quantity" type="number" min="0" required style={inputStyle}
              value={qty} onChange={e => setQty(parseInt(e.target.value))}
            />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              {[5, 10, 25, 50, 100].map(n => (
                <button key={n} type="button" onClick={() => setQty(q => q + n)} style={{
                  flex: 1, padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '0.4rem',
                  background: '#f8fafc', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit'
                }}>+{n}</button>
              ))}
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} onClick={() => setOpen(false)}>
            Actualizar Stock
          </button>
        </form>
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
          <form action={deleteInventoryItem}>
            <input type="hidden" name="id" value={itemId} />
            <button type="submit" style={{ width: '100%', background: 'none', border: '1px solid #fee2e2', color: '#ef4444', borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' }}>
              <Trash2 size={14} style={{ marginRight: '0.25rem' }} />
              Eliminar artículo
            </button>
          </form>
        </div>
      </Modal>
    </>
  );
}
