'use client';

import { useActionState, useState } from 'react';
import { createAppointment, updateAppointmentStatus, startAppointment } from '@/lib/actions';
import Modal from '@/components/Modal';
import { Plus, CheckCircle, XCircle, Play, Info, Calendar, Clock, User, MessageSquare } from 'lucide-react';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.8rem', borderRadius: '0.5rem',
  border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem', fontFamily: 'inherit'
};
const labelStyle: React.CSSProperties = { fontSize: '0.8rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.3rem' };
const fieldStyle: React.CSSProperties = { marginBottom: '1rem' };

export function NewAppointmentButton({ patients }: { patients: { id: string; name: string; species: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState(createAppointment, null);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        <Plus size={18} style={{ marginRight: '0.5rem' }} />
        Agendar Cita
      </button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Agendar Nueva Cita">
        {state?.success && <p style={{ color: '#166534', background: '#dcfce7', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>✓ {state.success}</p>}
        {state?.error && <p style={{ color: '#991b1b', background: '#fee2e2', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>⚠ {state.error}</p>}
        <form action={action}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Paciente *</label>
            <select name="patientId" required style={inputStyle}>
              <option value="">Seleccionar paciente...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.species})</option>
              ))}
            </select>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Tipo de Cita *</label>
            <select name="type" required style={inputStyle}>
              <option value="">Seleccionar tipo...</option>
              <option value="Consulta">Consulta General</option>
              <option value="Cirugía">Cirugía</option>
              <option value="Diagnóstico">Diagnóstico / Pruebas</option>
              <option value="Urgencia">Urgencia</option>
              <option value="Vacunación">Vacunación</option>
              <option value="Rehabilitación">Rehabilitación</option>
              <option value="Revisión">Revisión de seguimiento</option>
            </select>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Motivo de la Consulta *</label>
            <input name="reason" required style={inputStyle} placeholder="Ej: Revisión anual, vacunación..." />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Fecha y Hora *</label>
            <input name="dateTime" type="datetime-local" required style={inputStyle} />
          </div>
          <button type="submit" disabled={isPending} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            {isPending ? 'Agendando...' : 'Confirmar Cita'}
          </button>
        </form>
      </Modal>
    </>
  );
}

export function AppointmentStatusButtons({ appointmentId, currentStatus }: { appointmentId: string; currentStatus: string }) {
  if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED') {
    return <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{currentStatus === 'COMPLETED' ? 'Completada' : 'Cancelada'}</span>;
  }
  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      {currentStatus === 'SCHEDULED' && (
        <form action={startAppointment}>
          <input type="hidden" name="id" value={appointmentId} />
          <button type="submit" title="Iniciar consulta" style={{ background: '#e0f2fe', border: 'none', borderRadius: '0.4rem', padding: '0.3rem 0.6rem', cursor: 'pointer', color: '#0369a1' }}>
            <Play size={16} />
          </button>
        </form>
      )}
      <form action={updateAppointmentStatus}>
        <input type="hidden" name="id" value={appointmentId} />
        <input type="hidden" name="status" value="COMPLETED" />
        <button type="submit" title="Marcar como completada" style={{ background: '#dcfce7', border: 'none', borderRadius: '0.4rem', padding: '0.3rem 0.6rem', cursor: 'pointer', color: '#166534' }}>
          <CheckCircle size={16} />
        </button>
      </form>
      <form action={updateAppointmentStatus}>
        <input type="hidden" name="id" value={appointmentId} />
        <input type="hidden" name="status" value="CANCELLED" />
        <button type="submit" title="Cancelar" style={{ background: '#fee2e2', border: 'none', borderRadius: '0.4rem', padding: '0.3rem 0.6rem', cursor: 'pointer', color: '#991b1b' }}>
          <XCircle size={16} />
        </button>
      </form>
    </div>
  );
}

export function AppointmentDetailModal({ appointment }: { appointment: any }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} title="Ver detalles" style={{ background: '#f1f5f9', border: 'none', borderRadius: '0.4rem', padding: '0.3rem 0.6rem', cursor: 'pointer', color: '#64748b' }}>
        <Info size={16} />
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Detalles de la Cita">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paciente</p>
              <p style={{ fontWeight: '700', fontSize: '1.1rem' }}>{appointment.patientName} <span style={{ fontWeight: '400', color: '#64748b', fontSize: '0.9rem' }}>({appointment.patientSpecies})</span></p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem' }}>
              <p style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={12} /> FECHA</p>
              <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>{new Date(appointment.dateTime).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem' }}>
              <p style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={12} /> HORA</p>
              <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>{new Date(appointment.dateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem' }}>
            <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.25rem' }}>TIPO DE CITA</p>
            <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', borderRadius: '0.4rem', background: 'white', border: '1px solid #e2e8f0', display: 'inline-block' }}>{appointment.type}</span>
          </div>

          <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem' }}>
            <p style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.25rem' }}><MessageSquare size={12} /> MOTIVO</p>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>{appointment.reason}</p>
          </div>

          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: '700' }}>Acciones rápidas:</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <AppointmentStatusButtons appointmentId={appointment.id} currentStatus={appointment.status} />
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
