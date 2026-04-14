import db from '@/lib/db';
import Link from 'next/link';
import { Activity, ArrowLeft, Heart, Thermometer, Droplets, Camera, FileText, LogOut } from 'lucide-react';
import { HospitalizationEditor, DischargeButton, AdmitPatientButton, AddHospitalChargeForm } from '@/components/HospitalActions';

// Map hospitalization status to display-friendly labels
const hospStatusMap: Record<string, { label: string; color: string; bg: string }> = {
  OBSERVATION:    { label: 'Observación',      color: '#854d0e', bg: '#fef9c3' },
  STABLE:         { label: 'Estable',          color: '#166534', bg: '#dcfce7' },
  INTENSIVE_CARE: { label: 'UCI',              color: '#fecaca', bg: '#7f1d1d' },
  CRITICAL:       { label: 'Crítico',          color: '#fef2f2', bg: '#7f1d1d' },
  RECOVERING:     { label: 'Recuperación',     color: '#1e40af', bg: '#dbeafe' },
};

export default async function HospitalMonitorPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  // All non-discharged patients for the admit button
  const allPatients: any[] = db.prepare(`
    SELECT p.id, p.name, p.species FROM patients p
    WHERE p.id NOT IN (SELECT patientId FROM hospitalizations WHERE dischargeDate IS NULL)
    ORDER BY p.name
  `).all();

  // If no ID, show list of hospitalised patients
  if (!id) {
    const hospitalized: any[] = db.prepare(`
      SELECT p.*, u.name as ownerName, h.id as hospId, h.status as hospStatus, h.admissionDate, h.notes as hospNotes
      FROM patients p
      JOIN clients c ON p.ownerId = c.id
      JOIN users u ON c.userId = u.id
      JOIN hospitalizations h ON p.id = h.patientId
      WHERE h.dischargeDate IS NULL
      ORDER BY h.admissionDate ASC
    `).all();

    const statusMap: Record<string, string> = {
      CRITICAL: 'status-critical', HOSPITALIZED: 'status-hospitalized',
      STABLE: 'status-stable', OBSERVATION: 'status-observation'
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem' }}>Hospitalización</h1>
            <p style={{ color: '#64748b' }}>{hospitalized.length} pacientes internados actualmente.</p>
          </div>
          <AdmitPatientButton patients={allPatients} />
        </header>

        {hospitalized.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
            <Activity size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
            <p>No hay pacientes hospitalizados en este momento.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {hospitalized.map(p => {
              const hs = hospStatusMap[p.hospStatus] || { label: p.hospStatus, color: '#374151', bg: '#f1f5f9' };
              const days = Math.floor((Date.now() - new Date(p.admissionDate).getTime()) / 86400000);
              return (
                <div key={p.hospId} className="glass-card" style={{ background: 'white', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem' }}>{p.name}</h3>
                      <p style={{ fontSize: '0.85rem', color: '#64748b' }}>{p.species}{p.breed ? ` • ${p.breed}` : ''}</p>
                    </div>
                    <span style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem', borderRadius: '2rem', fontWeight: '600', background: hs.bg, color: hs.color, height: 'fit-content' }}>
                      {hs.label}
                    </span>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#64748b' }}>
                    <p><strong>Propietario:</strong> {p.ownerName}</p>
                    <p><strong>Ingreso:</strong> {new Date(p.admissionDate).toLocaleDateString('es-ES')} ({days === 0 ? 'hoy' : `${days} día${days !== 1 ? 's' : ''}`})</p>
                    {p.hospNotes && <p style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>"{p.hospNotes.substring(0, 80)}{p.hospNotes.length > 80 ? '...' : ''}"</p>}
                  </div>
                  <Link href={`/dashboard/hospital/monitor?id=${p.id}`} className="btn btn-primary" style={{ width: '100%', textDecoration: 'none', display: 'flex', justifyContent: 'center' }}>
                    <Activity size={16} style={{ marginRight: '0.5rem' }} />
                    Monitor en Vivo
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─── MONITOR PAGE for specific patient ───────────────────────────────────
  const patient: any = db.prepare(`
    SELECT p.*, u.name as ownerName, u.email as ownerEmail, c.phone as ownerPhone
    FROM patients p
    JOIN clients c ON p.ownerId = c.id
    JOIN users u ON c.userId = u.id
    WHERE p.id = ?
  `).get(id);

  if (!patient) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <h2 style={{ color: '#991b1b' }}>Paciente no encontrado</h2>
        <Link href="/dashboard/hospital/monitor" className="btn btn-primary" style={{ marginTop: '1.5rem', textDecoration: 'none' }}>Volver</Link>
      </div>
    );
  }

  const hosp: any = db.prepare(`
    SELECT * FROM hospitalizations WHERE patientId = ? AND dischargeDate IS NULL ORDER BY admissionDate DESC LIMIT 1
  `).get(id);

  const records: any[] = db.prepare(`
    SELECT mr.*, u.name as vetName
    FROM medical_records mr
    JOIN employees e ON mr.veterinarianId = e.id
    JOIN users u ON e.userId = u.id
    WHERE mr.patientId = ?
    ORDER BY mr.date DESC
    LIMIT 10
  `).all(id);

  const vitals = hosp?.vitals ? JSON.parse(hosp.vitals) : null;
  const hs = hosp ? (hospStatusMap[hosp.status] || { label: hosp.status, color: '#374151', bg: '#f1f5f9' }) : null;
  const admissionDays = hosp ? Math.floor((Date.now() - new Date(hosp.admissionDate).getTime()) / 86400000) : 0;

  const billingCatalog: any[] = db.prepare(`
    SELECT id, code, name, category, unit, unitPrice
    FROM billing_catalog
    WHERE isActive = 1
    ORDER BY category, name
  `).all();

  const recentCharges: any[] = hosp ? db.prepare(`
    SELECT ii.*, i.consultationNumber
    FROM invoice_items ii
    JOIN invoices i ON i.id = ii.invoiceId
    WHERE ii.hospitalizationId = ?
    ORDER BY ii.createdAt DESC
    LIMIT 12
  `).all(hosp.id) : [];

  const hospitalizationTotal = recentCharges.reduce((sum, line) => sum + Number(line.amount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/dashboard/hospital/monitor" className="btn" style={{ padding: '0.5rem', background: 'white', border: '1px solid var(--border)' }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ fontSize: '1.8rem' }}>
              Monitor: <span style={{ color: 'var(--primary)' }}>{patient.name}</span>
            </h1>
            <p style={{ color: '#64748b' }}>
              {patient.species}{patient.breed ? ` (${patient.breed})` : ''} · {patient.gender || 'Sin especificar'} · {patient.weight ? `${patient.weight}kg` : ''} · Propietario: {patient.ownerName}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {hosp && (
            <>
              <HospitalizationEditor
                hospId={hosp.id} patientId={patient.id}
                currentNotes={hosp.notes || ''} currentStatus={hosp.status}
                currentVitals={vitals}
              />
              <DischargeButton hospId={hosp.id} patientId={patient.id} patientName={patient.name} />
            </>
          )}
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* ECG Display */}
          <div className="glass-card" style={{ background: '#0f172a', padding: '2rem', borderRadius: '1rem', minHeight: '280px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4ade80', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Heart size={22} />
                <span style={{ fontSize: '1rem', fontWeight: '700' }}>ECG EN VIVO</span>
                <span style={{ fontSize: '0.75rem', background: '#4ade8022', border: '1px solid #4ade8044', padding: '0.2rem 0.6rem', borderRadius: '2rem' }}>● ACTIVO</span>
              </div>
              <span style={{ fontSize: '1.4rem', fontWeight: '800' }}>
                {vitals?.heart || '— BPM'}
              </span>
            </div>
            <div style={{ height: '180px', width: '100%', background: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(74,222,128,0.06) 40px, rgba(74,222,128,0.06) 41px)', position: 'relative', overflow: 'hidden', borderRadius: '0.5rem' }}>
              <svg width="100%" height="100%" viewBox="0 0 1000 100" preserveAspectRatio="none">
                <path d="M0,50 L60,50 L70,15 L85,85 L95,50 L200,50 L210,15 L225,85 L235,50 L400,50 L415,8 L430,92 L445,50 L600,50 L615,15 L630,85 L640,50 L800,50 L815,8 L830,92 L845,50 L1000,50"
                  stroke="#4ade80" strokeWidth="2" fill="none" />
              </svg>
            </div>
          </div>

          {/* Vitals Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {[
              { icon: <Thermometer color="#ef4444" size={28} />, label: 'Temperatura', value: vitals?.temp || '—', sub: 'Normal: 37.5-39.5°C' },
              { icon: <Heart color="#ec4899" size={28} />, label: 'Frec. Cardíaca', value: vitals?.heart || '—', sub: 'Normal: 60-180bpm' },
              { icon: <Activity color="#6366f1" size={28} />, label: 'Frec. Respiratoria', value: vitals?.resp || '—', sub: 'Normal: 15-30rpm' },
              { icon: <Droplets color="#0ea5e9" size={28} />, label: 'SpO2', value: vitals?.spo2 || '—', sub: 'Normal: >95%' },
            ].map((v, i) => (
              <div key={i} className="glass-card" style={{ background: 'white', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {v.icon}
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>{v.label}</p>
                <h3 style={{ fontSize: '1.3rem' }}>{v.value}</h3>
                <p style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{v.sub}</p>
              </div>
            ))}
          </div>

          {/* Medical Records */}
          <div className="glass-card" style={{ background: 'white', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} color="var(--primary)" /> Historial Médico
            </h2>
            {records.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>Sin registros médicos.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {records.map(r => (
                  <div key={r.id} style={{ paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--primary)' }}>{r.vetName}</p>
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(r.date).toLocaleDateString('es-ES')}</p>
                    </div>
                    <p style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{r.diagnosis}</p>
                    {r.treatment && <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Tto: {r.treatment}</p>}
                    {r.observations && <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '0.25rem' }}>{r.observations}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Billable Monitoring */}
          {hosp && (
            <div className="glass-card" style={{ background: 'white', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Seguimiento Facturable</h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
                Registra medicacion, procedimientos y consumibles aplicados al paciente. Cada registro se suma automaticamente en la factura de su consulta.
              </p>

              <AddHospitalChargeForm hospId={hosp.id} catalogItems={billingCatalog} />

              <div style={{ marginTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: '700' }}>Ultimos cargos</p>
                  <p style={{ fontSize: '0.82rem', color: '#0f766e', fontWeight: '700' }}>Acumulado: {hospitalizationTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
                </div>
                {recentCharges.length === 0 ? (
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Sin cargos registrados todavia.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {recentCharges.map((line) => (
                      <div key={line.id} style={{ background: '#f8fafc', borderRadius: '0.5rem', padding: '0.6rem 0.7rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                          <p style={{ fontSize: '0.8rem', fontWeight: '700' }}>{line.description}</p>
                          <p style={{ fontSize: '0.8rem', fontWeight: '700' }}>{Number(line.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
                        </div>
                        <p style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {Number(line.quantity)} {line.unit} x {Number(line.unitPrice).toLocaleString('es-ES', { minimumFractionDigits: 2 })} € · {line.consultationNumber || 'Sin consulta'}
                        </p>
                        {line.notes && <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>{line.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Status Card */}
          {hosp ? (
            <div className="glass-card" style={{ background: 'linear-gradient(135deg, #0f766e, #134e4a)', color: 'white', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1rem', marginBottom: '1rem', opacity: 0.8 }}>Estado de Hospitalización</h2>
              <span style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem', borderRadius: '2rem', background: 'rgba(255,255,255,0.2)', fontWeight: '600' }}>
                {hs?.label}
              </span>
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                  Ingreso: {new Date(hosp.admissionDate).toLocaleDateString('es-ES')} ({admissionDays === 0 ? 'hoy' : `${admissionDays} día${admissionDays !== 1 ? 's' : ''}`})
                </p>
                {hosp.notes && (
                  <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '0.5rem', marginTop: '0.5rem' }}>
                    <p style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>"{hosp.notes}"</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ background: 'white', padding: '1.5rem', textAlign: 'center' }}>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Paciente no hospitalizado actualmente.</p>
            </div>
          )}

          {/* Simulated Camera Feed */}
          <div className="glass-card" style={{ background: 'white', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Camera size={16} /> Cámara del Box
            </h2>
            <div style={{ width: '100%', aspectRatio: '4/3', background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', background: '#ef4444', borderRadius: '2rem', padding: '0.2rem 0.5rem', fontSize: '0.65rem', fontWeight: '700', color: 'white' }}>● LIVE</div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', textAlign: 'center' }}>INFRARED ACTIVE<br />Signal OK</p>
            </div>
          </div>

          {/* Patient Info */}
          <div className="glass-card" style={{ background: 'white', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Datos del Propietario</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <p><strong>Nombre:</strong> {patient.ownerName}</p>
              <p><strong>Email:</strong> {patient.ownerEmail}</p>
              {patient.ownerPhone && <p><strong>Tel:</strong> {patient.ownerPhone}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
