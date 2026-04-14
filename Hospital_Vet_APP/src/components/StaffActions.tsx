'use client';

import { useActionState, useState } from 'react';
import { createEmployee, deleteEmployee } from '@/lib/actions';
import Modal from '@/components/Modal';
import { Plus, Trash2, User } from 'lucide-react';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.8rem', borderRadius: '0.5rem',
  border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem', fontFamily: 'inherit'
};
const labelStyle: React.CSSProperties = { fontSize: '0.8rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.3rem' };
const fieldStyle: React.CSSProperties = { marginBottom: '1rem' };

export function NewEmployeeButton() {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState(createEmployee, null);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        <Plus size={18} style={{ marginRight: '0.5rem' }} />
        Añadir Empleado
      </button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Registrar Nuevo Empleado">
        {state?.success && <p style={{ color: '#166534', background: '#dcfce7', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>✓ {state.success}</p>}
        {state?.error && <p style={{ color: '#991b1b', background: '#fee2e2', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>⚠ {state.error}</p>}
        <form action={action}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Nombre completo *</label>
              <input name="name" required style={inputStyle} placeholder="Ej: Dr. Juan García" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Email *</label>
              <input name="email" type="email" required style={inputStyle} placeholder="juan@hospitalvet.com" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Rol *</label>
              <select name="role" required style={inputStyle}>
                <option value="">Seleccionar...</option>
                <option value="ADMIN">Administrador</option>
                <option value="VETERINARIAN">Veterinario</option>
                <option value="STAFF">Auxiliar / Staff</option>
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Contraseña *</label>
              <input name="password" type="password" required style={inputStyle} placeholder="Mínimo 6 caracteres" minLength={6} />
            </div>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Especialización</label>
            <input name="specialization" style={inputStyle} placeholder="Ej: Cirugía Avanzada, Animales Exóticos..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Nº de Licencia</label>
              <input name="licenseNumber" style={inputStyle} placeholder="VET-XXXX" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Turno Asignado</label>
              <select name="schedule" style={inputStyle}>
                <option value="">Sin asignar</option>
                <option value="Mañana (08:00 - 16:00)">Mañana (08:00 - 16:00)</option>
                <option value="Tarde (16:00 - 00:00)">Tarde (16:00 - 00:00)</option>
                <option value="Noche (23:00 - 07:00)">Noche (23:00 - 07:00)</option>
                <option value="Rotativo">Rotativo</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={isPending} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            {isPending ? 'Registrando...' : 'Añadir Empleado'}
          </button>
        </form>
      </Modal>
    </>
  );
}

export function DeleteEmployeeButton({ userId, name }: { userId: string; name: string }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <button onClick={() => setConfirm(true)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.3rem 0.5rem', fontSize: '0.85rem', fontFamily: 'inherit' }}>
        <Trash2 size={14} />
      </button>
      <Modal isOpen={confirm} onClose={() => setConfirm(false)} title="Eliminar Empleado" width="360px">
        <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          ¿Eliminar a <strong>{name}</strong> del sistema? Se eliminarán también sus credenciales de acceso.
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setConfirm(false)} className="btn" style={{ flex: 1, border: '1px solid #e2e8f0' }}>Cancelar</button>
          <form action={deleteEmployee} style={{ flex: 1 }}>
            <input type="hidden" name="userId" value={userId} />
            <button type="submit" className="btn" style={{ width: '100%', background: '#ef4444', color: 'white' }}>Eliminar</button>
          </form>
        </div>
      </Modal>
    </>
  );
}
