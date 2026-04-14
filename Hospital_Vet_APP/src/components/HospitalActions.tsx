'use client';

import { useActionState, useState } from 'react';
import { updateHospitalization, dischargePatient, admitPatient, addHospitalizationCharge } from '@/lib/actions';
import Modal from '@/components/Modal';
import { Edit3, LogOut, Plus } from 'lucide-react';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.8rem', borderRadius: '0.5rem',
  border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem', fontFamily: 'inherit'
};
const labelStyle: React.CSSProperties = { fontSize: '0.8rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.3rem' };
const fieldStyle: React.CSSProperties = { marginBottom: '1rem' };

export function HospitalizationEditor({
  hospId, patientId, currentNotes, currentStatus, currentVitals
}: {
  hospId: string; patientId: string;
  currentNotes: string; currentStatus: string;
  currentVitals: { temp: string; heart: string; resp: string; spo2: string } | null;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
        <Edit3 size={16} style={{ marginRight: '0.5rem' }} />
        Actualizar Seguimiento
      </button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Actualizar Seguimiento Clínico">
        <form action={updateHospitalization}>
          <input type="hidden" name="id" value={hospId} />
          <div style={fieldStyle}>
            <label style={labelStyle}>Estado Clínico</label>
            <select name="status" defaultValue={currentStatus} style={inputStyle}>
              <option value="OBSERVATION">Observación</option>
              <option value="STABLE">Estable</option>
              <option value="INTENSIVE_CARE">UCI</option>
              <option value="CRITICAL">Crítico</option>
              <option value="RECOVERING">En Recuperación</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Temperatura</label>
              <input name="temp" defaultValue={currentVitals?.temp || ''} style={inputStyle} placeholder="Ej: 38.5°C" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Frec. Cardíaca</label>
              <input name="heart" defaultValue={currentVitals?.heart || ''} style={inputStyle} placeholder="Ej: 120bpm" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Frec. Respiratoria</label>
              <input name="resp" defaultValue={currentVitals?.resp || ''} style={inputStyle} placeholder="Ej: 24rpm" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>SpO2</label>
              <input name="spo2" defaultValue={currentVitals?.spo2 || ''} style={inputStyle} placeholder="Ej: 98%" />
            </div>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Notas Clínicas</label>
            <textarea name="notes" rows={4} defaultValue={currentNotes} style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="Evolución del paciente, observaciones..." />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} onClick={() => setOpen(false)}>
            Guardar Seguimiento
          </button>
        </form>
      </Modal>
    </>
  );
}

export function DischargeButton({ hospId, patientId, patientName }: { hospId: string; patientId: string; patientName: string }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <button onClick={() => setConfirm(true)} className="btn" style={{ background: '#dcfce7', color: '#166534', border: 'none' }}>
        <LogOut size={16} style={{ marginRight: '0.5rem' }} />
        Dar de Alta
      </button>
      <Modal isOpen={confirm} onClose={() => setConfirm(false)} title="Dar de Alta al Paciente" width="380px">
        <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '1.5rem' }}>
          ¿Confirmas el alta de <strong>{patientName}</strong>? El estado del paciente cambiará a <strong>Sano</strong> y se cerrará la hospitalización.
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setConfirm(false)} className="btn" style={{ flex: 1, border: '1px solid #e2e8f0' }}>Cancelar</button>
          <form action={dischargePatient} style={{ flex: 1 }}>
            <input type="hidden" name="hospId" value={hospId} />
            <input type="hidden" name="patientId" value={patientId} />
            <button type="submit" className="btn" style={{ width: '100%', background: '#0f766e', color: 'white' }}>
              Confirmar Alta
            </button>
          </form>
        </div>
      </Modal>
    </>
  );
}

export function AdmitPatientButton({ patients }: { patients: { id: string; name: string; species: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState(admitPatient, null);
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-primary">
        <Plus size={18} style={{ marginRight: '0.5rem' }} />
        Ingresar Paciente
      </button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Ingresar Paciente en Hospitalización">
        {state?.success && <p style={{ color: '#166534', background: '#dcfce7', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>✓ {state.success}</p>}
        {state?.error && <p style={{ color: '#991b1b', background: '#fee2e2', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>⚠ {state.error}</p>}
        <form action={action}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Paciente *</label>
            <select name="patientId" required style={inputStyle}>
              <option value="">Seleccionar paciente...</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.species})</option>)}
            </select>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Estado de Ingreso</label>
            <select name="hospStatus" style={inputStyle}>
              <option value="OBSERVATION">Observación</option>
              <option value="STABLE">Estable</option>
              <option value="INTENSIVE_CARE">UCI / Cuidados Intensivos</option>
            </select>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Notas de Ingreso</label>
            <textarea name="notes" rows={3} style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="Motivo del ingreso, estado inicial..." />
          </div>
          <button type="submit" disabled={isPending} className="btn btn-primary" style={{ width: '100%' }}>
            {isPending ? 'Confirmando...' : 'Confirmar Ingreso'}
          </button>
        </form>
      </Modal>
    </>
  );
}

export function AdmitPatientInlineButton({ patientId, patientName }: { patientId: string; patientName: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState(admitPatient, null);
  return (
    <>
      <button onClick={() => setOpen(true)} title="Ingresar en Hospital" style={{ background: '#fee2e2', border: 'none', borderRadius: '0.4rem', padding: '0.3rem 0.6rem', cursor: 'pointer', color: '#991b1b', fontSize: '0.75rem', fontWeight: '700' }}>
        <Plus size={14} style={{ marginRight: '2px' }} /> Hospitalizar
      </button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title={`Ingresar a ${patientName}`}>
        {state?.success && <p style={{ color: '#166534', background: '#dcfce7', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>✓ {state.success}</p>}
        {state?.error && <p style={{ color: '#991b1b', background: '#fee2e2', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>⚠ {state.error}</p>}
        <form action={action}>
          <input type="hidden" name="patientId" value={patientId} />
          <div style={fieldStyle}>
            <label style={labelStyle}>Estado de Ingreso</label>
            <select name="hospStatus" style={inputStyle}>
              <option value="OBSERVATION">Observación</option>
              <option value="STABLE">Estable</option>
              <option value="INTENSIVE_CARE">UCI / Cuidados Intensivos</option>
            </select>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Notas de Ingreso</label>
            <textarea name="notes" rows={3} style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="Motivo del ingreso, estado inicial..." />
          </div>
          <button type="submit" disabled={isPending} className="btn" style={{ width: '100%', background: '#991b1b', color: 'white' }}>
            {isPending ? 'Confirmando...' : 'Confirmar Hospitalización'}
          </button>
        </form>
      </Modal>
    </>
  );
}

export function AddHospitalChargeForm({
  hospId,
  catalogItems
}: {
  hospId: string;
  catalogItems: { id: string; code: string; name: string; category: string; unit: string; unitPrice: number }[];
}) {
  const [state, action, isPending] = useActionState(addHospitalizationCharge, null);

  return (
    <form action={action} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr auto', gap: '0.65rem', alignItems: 'end' }}>
      <input type="hidden" name="hospId" value={hospId} />
      <div>
        <label style={labelStyle}>Item clínico</label>
        <select name="catalogItemId" required style={inputStyle}>
          <option value="">Seleccionar...</option>
          {catalogItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.category}) · {Number(item.unitPrice).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €/ {item.unit}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Cantidad</label>
        <input name="quantity" type="number" min="0.01" step="0.01" defaultValue="1" required style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Notas</label>
        <input name="notes" style={inputStyle} placeholder="Ej: IV cada 8h" />
      </div>
      <button type="submit" disabled={isPending} className="btn btn-primary" style={{ height: '42px', marginBottom: '1px' }}>
        {isPending ? 'Guardando...' : 'Añadir'}
      </button>

      {state?.error && (
        <p style={{ gridColumn: '1 / -1', fontSize: '0.78rem', color: '#991b1b', background: '#fee2e2', borderRadius: '0.4rem', padding: '0.45rem 0.6rem' }}>
          {state.error}
        </p>
      )}
      {state?.success && (
        <p style={{ gridColumn: '1 / -1', fontSize: '0.78rem', color: '#166534', background: '#dcfce7', borderRadius: '0.4rem', padding: '0.45rem 0.6rem' }}>
          {state.success}
        </p>
      )}
    </form>
  );
}
