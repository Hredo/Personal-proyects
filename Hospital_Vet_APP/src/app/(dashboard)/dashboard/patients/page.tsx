import db from '@/lib/db';
import { Search, PawPrint, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { NewPatientButton, PatientStatusButton, DeletePatientButton } from '@/components/PatientActions';
import { AdmitPatientInlineButton } from '@/components/HospitalActions';

const statusColor: Record<string, { bg: string; color: string; label: string }> = {
  HEALTHY:      { bg: '#dcfce7', color: '#166534', label: 'Sano' },
  TREATMENT:    { bg: '#fef9c3', color: '#854d0e', label: 'En Tratamiento' },
  HOSPITALIZED: { bg: '#fee2e2', color: '#991b1b', label: 'Hospitalizado' },
  CRITICAL:     { bg: '#7f1d1d', color: '#fecaca', label: 'Crítico' },
};

export default async function PatientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;

  const owners: any[] = db.prepare(`
    SELECT c.id, u.name as userName FROM clients c JOIN users u ON c.userId = u.id ORDER BY u.name
  `).all();

  let patients: any[] = db.prepare(`
    SELECT p.*, u.name as ownerName, c.phone as ownerPhone
    FROM patients p
    JOIN clients c ON p.ownerId = c.id
    JOIN users u ON c.userId = u.id
    ORDER BY p.createdAt DESC
  `).all();

  if (q) {
    const term = q.toLowerCase();
    patients = patients.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.species.toLowerCase().includes(term) ||
      p.ownerName.toLowerCase().includes(term) ||
      p.id.toLowerCase().includes(term)
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem' }}>Gestión de Pacientes</h1>
          <p style={{ color: '#64748b' }}>{patients.length} pacientes registrados en la base de datos.</p>
        </div>
        <NewPatientButton owners={owners} />
      </header>

      <form method="GET" action="/dashboard/patients">
        <div className="glass-card" style={{ background: 'white', padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text" name="q" defaultValue={q || ''}
              placeholder="Buscar por nombre, especie, dueño o ID..."
              style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', outline: 'none' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem' }}>Buscar</button>
          {q && (
            <Link href="/dashboard/patients" className="btn" style={{ border: '1px solid var(--border)', background: 'white' }}>Limpiar</Link>
          )}
        </div>
      </form>

      {patients.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
          <PawPrint size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
          <p>No se encontraron pacientes{q ? ` para "${q}"` : ''}.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {patients.map((patient) => {
            const st = statusColor[patient.status] || { bg: '#f1f5f9', color: '#374151', label: patient.status };
            return (
              <div key={patient.id} className="glass-card" style={{ background: 'white', padding: '1.5rem', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                  <DeletePatientButton patientId={patient.id} />
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                    <PawPrint size={28} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.05rem' }}>{patient.name}</h3>
                      <PatientStatusButton patientId={patient.id} currentStatus={patient.status} />
                    </div>
                    <p style={{ color: '#64748b', fontSize: '0.85rem' }}>{patient.species}{patient.breed ? ` • ${patient.breed}` : ''}</p>
                    <p style={{ color: 'var(--primary)', fontSize: '0.72rem', fontWeight: '600', marginTop: '0.2rem' }}>ID: {patient.id}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ background: '#f8fafc', padding: '0.6rem', borderRadius: '0.5rem' }}>
                    <p style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Peso</p>
                    <p style={{ fontSize: '0.95rem', fontWeight: '600' }}>{patient.weight ? `${patient.weight} kg` : '—'}</p>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '0.6rem', borderRadius: '0.5rem' }}>
                    <p style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registro</p>
                    <p style={{ fontSize: '0.95rem', fontWeight: '600' }}>{new Date(patient.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</p>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                  <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Propietario</p>
                      <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>{patient.ownerName}</p>
                      {patient.ownerPhone && <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{patient.ownerPhone}</p>}
                    </div>
                    {patient.status !== 'HOSPITALIZED' && patient.status !== 'CRITICAL' && (
                      <AdmitPatientInlineButton patientId={patient.id} patientName={patient.name} />
                    )}
                  </div>
                  <Link href={`/dashboard/hospital/monitor?id=${patient.id}`} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--primary)', fontWeight: '600', fontSize: '0.85rem',
                    textDecoration: 'none', padding: '0.5rem', background: '#f0fdf9',
                    borderRadius: '0.5rem', border: '1px solid #ccfbf1', gap: '0.5rem'
                  }}>
                    Ver Historial y Monitor →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
