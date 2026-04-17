'use client';

import { useActionState, useState } from 'react';
import { createPatient, updatePatientStatus, deletePatient } from '@/lib/actions';
import Modal from '@/components/Modal';
import { Plus, Trash2, RefreshCw } from 'lucide-react';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.8rem', borderRadius: '0.5rem',
  border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem', fontFamily: 'inherit'
};
const labelStyle: React.CSSProperties = { fontSize: '0.8rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.3rem' };
const fieldStyle: React.CSSProperties = { marginBottom: '1rem' };

export function NewPatientButton({ owners }: { owners: { id: string; userName: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState(createPatient, null);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        <Plus size={18} style={{ marginRight: '0.5rem' }} />
        Registrar Nuevo Paciente
      </button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Registrar Nuevo Paciente">
        {state?.success && <p style={{ color: '#166534', background: '#dcfce7', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>✓ {state.success}</p>}
        {state?.error && <p style={{ color: '#991b1b', background: '#fee2e2', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>⚠ {state.error}</p>}
        <form action={action}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Nombre *</label>
              <input name="name" required style={inputStyle} placeholder="Ej: Luna" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Especie *</label>
              <select name="species" required style={inputStyle}>
                <option value="">Seleccionar...</option>
                {['Perro','Gato','Caballo','Conejo','Loro','Iguana','Tortuga','Pez','Otro'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Raza</label>
              <input name="breed" style={inputStyle} placeholder="Ej: Golden Retriever" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Género</label>
              <select name="gender" style={inputStyle}>
                <option value="">No especificado</option>
                <option value="Macho">Macho</option>
                <option value="Hembra">Hembra</option>
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Fecha de Nacimiento</label>
              <input name="birthDate" type="date" style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Peso (kg)</label>
              <input name="weight" type="number" step="0.1" min="0" style={inputStyle} placeholder="Ej: 5.2" />
            </div>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Propietario *</label>
            <select name="ownerId" required style={inputStyle}>
              <option value="">Seleccionar propietario...</option>
              {owners.map(o => <option key={o.id} value={o.id}>{o.userName}</option>)}
            </select>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Estado</label>
            <select name="status" style={inputStyle}>
              <option value="HEALTHY">Sano</option>
              <option value="TREATMENT">En Tratamiento</option>
              <option value="HOSPITALIZED">Hospitalizado</option>
              <option value="CRITICAL">Crítico</option>
            </select>
          </div>
          <button type="submit" disabled={isPending} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            {isPending ? 'Guardando...' : 'Registrar Paciente'}
          </button>
        </form>
      </Modal>
    </>
  );
}

export function PatientStatusButton({ patientId, currentStatus }: { patientId: string; currentStatus: string }) {
  const [open, setOpen] = useState(false);
  const statuses = ['HEALTHY', 'TREATMENT', 'HOSPITALIZED', 'CRITICAL'];
  const colors: Record<string, string> = { HEALTHY: '#166534', TREATMENT: '#854d0e', HOSPITALIZED: '#991b1b', CRITICAL: '#450a0a' };
  const bg: Record<string, string> = { HEALTHY: '#dcfce7', TREATMENT: '#fef9c3', HOSPITALIZED: '#fee2e2', CRITICAL: '#fecaca' };
  const labels: Record<string, string> = { HEALTHY: 'Sano', TREATMENT: 'En Tratamiento', HOSPITALIZED: 'Hospitalizado', CRITICAL: 'Crítico' };

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer',
        background: bg[currentStatus] || '#f1f5f9', color: colors[currentStatus] || '#374151', fontWeight: '600'
      }}>
        {labels[currentStatus] || currentStatus}
      </button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Cambiar Estado del Paciente" width="360px">
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>Selecciona el nuevo estado clínico:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {statuses.map(s => (
            <form key={s} action={async (formData) => { await updatePatientStatus(formData); }}>
              <input type="hidden" name="id" value={patientId} />
              <input type="hidden" name="status" value={s} />
              <button type="submit" style={{
                width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: `2px solid ${s === currentStatus ? colors[s] : '#e2e8f0'}`,
                background: s === currentStatus ? bg[s] : 'white', color: colors[s] || '#374151',
                fontWeight: s === currentStatus ? '700' : '500', cursor: 'pointer', textAlign: 'left',
                fontSize: '0.9rem', fontFamily: 'inherit'
              }} onClick={() => setOpen(false)}>
                {s === currentStatus ? '✓ ' : ''}{labels[s]}
              </button>
            </form>
          ))}
        </div>
      </Modal>
    </>
  );
}

export function DeletePatientButton({ patientId }: { patientId: string }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <button onClick={() => setConfirm(true)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' }}>
        <Trash2 size={16} />
      </button>
      <Modal isOpen={confirm} onClose={() => setConfirm(false)} title="Eliminar Paciente" width="360px">
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>¿Estás seguro? Esta acción eliminará el paciente y todos sus registros médicos.</p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setConfirm(false)} className="btn" style={{ flex: 1, border: '1px solid #e2e8f0' }}>Cancelar</button>
          <form action={async (formData) => { await deletePatient(formData); }} style={{ flex: 1 }}>
            <input type="hidden" name="id" value={patientId} />
            <button type="submit" className="btn" style={{ width: '100%', background: '#ef4444', color: 'white' }}>
              Eliminar
            </button>
          </form>
        </div>
      </Modal>
    </>
  );
}
