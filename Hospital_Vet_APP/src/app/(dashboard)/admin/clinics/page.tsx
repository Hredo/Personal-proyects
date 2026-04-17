import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getAllClinics } from '@/lib/multi-tenant';
import ClinicManagement from '@/components/ClinicManagement';

export default async function ClinicAdmin() {
  const session = await auth();
  
  // Only admins can access this
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  const clinics = getAllClinics();

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>🏥 Gestión de Clínicas</h1>
        <p style={{ color: '#666' }}>Administra diferentes locales/clínicas de tu red veterinaria</p>
      </div>

      <ClinicManagement clinics={clinics} />

      {clinics.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Estadísticas Generales</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ background: '#e3f2fd', padding: '1.5rem', borderRadius: '0.75rem' }}>
              <div style={{ fontSize: '0.9rem', color: '#1976d2' }}>Total de Clínicas</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1565c0' }}>{clinics.length}</div>
            </div>
            <div style={{ background: '#e8f5e9', padding: '1.5rem', borderRadius: '0.75rem' }}>
              <div style={{ fontSize: '0.9rem', color: '#388e3c' }}>Clínicas Activas</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2e7d32' }}>
                {clinics.filter(c => c.status === 'ACTIVE').length}
              </div>
            </div>
            <div style={{ background: '#fff3e0', padding: '1.5rem', borderRadius: '0.75rem' }}>
              <div style={{ fontSize: '0.9rem', color: '#f57c00' }}>Plan Enterprise</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e65100' }}>
                {clinics.filter(c => c.plan === 'ENTERPRISE').length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
