'use client';

import { useActionState, useState } from 'react';
import { createAppointment } from '@/lib/actions';
import Modal from '@/components/Modal';
import { Calendar, Plus } from 'lucide-react';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.8rem', borderRadius: '0.5rem',
  border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem', fontFamily: 'inherit'
};
const labelStyle: React.CSSProperties = { fontSize: '0.8rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.3rem' };
const fieldStyle: React.CSSProperties = { marginBottom: '1rem' };

export function RequestAppointmentButton({ pets }: { pets: { id: string; name: string; species: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState(createAppointment, null);

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        background: 'var(--primary)', color: 'white', border: 'none',
        padding: '0.6rem 1.2rem', borderRadius: '0.5rem', cursor: 'pointer',
        fontSize: '0.9rem', fontFamily: 'inherit', fontWeight: '600'
      }}>
        <Plus size={16} />
        Solicitar Cita
      </button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Solicitar Nueva Cita">
        {state?.success && (
          <p style={{ color: '#166534', background: '#dcfce7', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>
            ✓ {state.success} El equipo confirmará la cita próximamente.
          </p>
        )}
        {state?.error && (
          <p style={{ color: '#991b1b', background: '#fee2e2', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>⚠ {state.error}</p>
        )}
        <form action={action}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Mascota *</label>
            <select name="patientId" required style={inputStyle}>
              <option value="">Selecciona tu mascota...</option>
              {pets.map(p => <option key={p.id} value={p.id}>{p.name} ({p.species})</option>)}
            </select>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Tipo de Visita *</label>
            <select name="type" required style={inputStyle}>
              <option value="">¿Qué necesitas?</option>
              <option value="Consulta">Consulta general</option>
              <option value="Vacunación">Vacunación</option>
              <option value="Revisión">Revisión de seguimiento</option>
              <option value="Urgencia">Urgencia</option>
              <option value="Diagnóstico">Diagnóstico / Análisis</option>
            </select>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Motivo de la Consulta *</label>
            <textarea name="reason" required rows={3} style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="Describe brevemente por qué quieres visitar al veterinario..." />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Fecha y Hora Preferida *</label>
            <input name="dateTime" type="datetime-local" required style={inputStyle} min={new Date().toISOString().slice(0, 16)} />
          </div>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '1rem', lineHeight: '1.4' }}>
            * Nuestro equipo revisará tu solicitud y te confirmará la cita en un plazo de 24h.
          </p>
          <button type="submit" disabled={isPending} style={{
            width: '100%', padding: '0.75rem', background: 'var(--primary)', color: 'white',
            border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', fontSize: '0.95rem'
          }}>
            {isPending ? 'Enviando solicitud...' : 'Enviar Solicitud de Cita'}
          </button>
        </form>
      </Modal>
    </>
  );
}

export function PetHistoryPanel({ pet, records, appointments }: {
  pet: { id: string; name: string; species: string };
  records: any[];
  appointments: any[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        background: '#f0fdf9', color: 'var(--primary)', border: '1px solid #ccfbf1',
        padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer',
        fontSize: '0.85rem', fontFamily: 'inherit', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.5rem'
      }}>
        <Calendar size={14} />
        Ver Historial Completo
      </button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title={`Historial Médico: ${pet.name}`} width="640px">
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', color: '#0f766e', marginBottom: '1rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Registros Médicos ({records.length})
          </h3>
          {records.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Sin registros médicos aún.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {records.map(r => (
                <div key={r.id} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', borderLeft: '3px solid var(--primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <p style={{ fontWeight: '700', fontSize: '0.85rem' }}>{r.vetName || 'Veterinario'}</p>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(r.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <p style={{ fontWeight: '600', marginBottom: '0.3rem' }}>Diagnóstico: <span style={{ fontWeight: '400' }}>{r.diagnosis}</span></p>
                  {r.treatment && <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.3rem' }}>Tratamiento: {r.treatment}</p>}
                  {r.observations && <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Obs: {r.observations}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 style={{ fontSize: '0.9rem', color: '#0f766e', marginBottom: '1rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Historial de Citas ({appointments.length})
          </h3>
          {appointments.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Sin citas registradas.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {appointments.map(a => {
                const stMap: Record<string, { bg: string; color: string; label: string }> = {
                  COMPLETED: { bg: '#dcfce7', color: '#166534', label: 'Completada' },
                  SCHEDULED: { bg: '#dbeafe', color: '#1e40af', label: 'Programada' },
                  CANCELLED: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelada' },
                };
                const st = stMap[a.status] || { bg: '#f1f5f9', color: '#374151', label: a.status };
                return (
                  <div key={a.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                    <div style={{ minWidth: '80px', textAlign: 'center', padding: '0.5rem', background: 'white', borderRadius: '0.4rem' }}>
                      <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{new Date(a.dateTime).toLocaleDateString('es-ES', { month: 'short' })}</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: '700' }}>{new Date(a.dateTime).getDate()}</p>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: '600', fontSize: '0.85rem' }}>{a.type}</p>
                      <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{a.reason}</p>
                    </div>
                    <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '2rem', background: st.bg, color: st.color, fontWeight: '600', whiteSpace: 'nowrap' }}>{st.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
