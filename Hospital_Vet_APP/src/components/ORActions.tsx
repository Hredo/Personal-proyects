'use client';

import { useActionState, useState } from 'react';
import { occupyOR, releaseOR, updateORStatus } from '@/lib/actions';
import Modal from '@/components/Modal';
import { Play, CheckCircle, RefreshCcw, UserPlus, X, FileText, ClipboardList } from 'lucide-react';

export function OccupyORButton({ orId, orName, patients, staff }: { 
  orId: string, 
  orName: string, 
  patients: any[], 
  staff: any[] 
}) {
  const [open, setOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [state, action, isPending] = useActionState(occupyOR, null);

  const toggleStaff = (id: string) => {
    setSelectedStaff(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
        <Play size={14} /> Iniciar Cirugía
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={`Ocupar ${orName}`}>
        {state?.error && <p style={{ color: '#991b1b', background: '#fee2e2', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>⚠ {state.error}</p>}
        {state?.success && <p style={{ color: '#166534', background: '#dcfce7', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>✓ {state.success}</p>}
        <form action={action}>
          <input type="hidden" name="orId" value={orId} />
          <input type="hidden" name="staffIds" value={JSON.stringify(selectedStaff)} />
          
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.4rem' }}>Paciente *</label>
            <select name="patientId" required style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <option value="">Selecciona paciente...</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.species}) - {p.ownerName}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.4rem' }}>Procedimiento *</label>
            <input name="procedure" required placeholder="Ej: Esterilización, Limpieza dental..." style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }} />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.4rem' }}>Equipo Médico ({selectedStaff.length})</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
              {staff.map(s => (
                <button 
                  key={s.id} 
                  type="button"
                  onClick={() => toggleStaff(s.id)}
                  style={{ 
                    padding: '0.3rem 0.6rem', 
                    borderRadius: '2rem', 
                    fontSize: '0.75rem', 
                    background: selectedStaff.includes(s.id) ? 'var(--primary)' : '#f1f5f9',
                    color: selectedStaff.includes(s.id) ? 'white' : '#64748b',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {s.userName}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={isPending} className="btn btn-primary" style={{ width: '100%' }}>
            {isPending ? 'Procesando...' : 'Confirmar Ingreso a Quirófano'}
          </button>
        </form>
      </Modal>
    </>
  );
}

export function ReleaseORButton({ orId, orName }: { orId: string, orName: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState(releaseOR, null);

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.4rem 0.8rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '0.4rem', cursor: 'pointer' }}>
        <CheckCircle size={14} /> Finalizar
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={`Finalizar Cirugía - ${orName}`}>
        {state?.error && <p style={{ color: '#991b1b', background: '#fee2e2', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>⚠ {state.error}</p>}
        {state?.success && <p style={{ color: '#166534', background: '#dcfce7', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>✓ {state.success}</p>}
        <form action={action}>
          <input type="hidden" name="orId" value={orId} />
          
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.4rem' }}>Hallazgos / Informe Cirugía</label>
            <textarea name="findings" rows={5} placeholder="Describe el resultado de la intervención..." style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }} />
          </div>

          <button type="submit" disabled={isPending} className="btn" style={{ width: '100%', background: '#dc2626', color: 'white' }}>
            {isPending ? 'Guardando...' : 'Finalizar y Liberar'}
          </button>
        </form>
      </Modal>
    </>
  );
}

export function CleanORButton({ orId }: { orId: string }) {
  const [isPending, setIsPending] = useState(false);

  async function handleClean() {
    setIsPending(true);
    await updateORStatus(orId, 'AVAILABLE');
    setIsPending(false);
  }

  return (
    <button onClick={handleClean} disabled={isPending} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.4rem 0.8rem', background: '#059669', color: 'white', border: 'none', borderRadius: '0.4rem', cursor: 'pointer' }}>
      <RefreshCcw size={14} className={isPending ? 'animate-spin' : ''} /> {isPending ? 'Actualizando...' : 'Terminar Limpieza'}
    </button>
  );
}

export function ORHistoryModal({ orName, findings }: { orName: string, findings: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} title="Ver último informe" style={{ background: '#f1f5f9', border: 'none', borderRadius: '0.4rem', padding: '0.4rem 0.8rem', cursor: 'pointer', color: '#64748b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <ClipboardList size={14} /> Historial
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={`Último Informe - ${orName}`}>
        {findings ? (
          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Resultado de la intervención:</p>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#334155', whiteSpace: 'pre-wrap' }}>{findings}</p>
          </div>
        ) : (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No hay informes previos registrados para este quirófano.</p>
        )}
      </Modal>
    </>
  );
}
