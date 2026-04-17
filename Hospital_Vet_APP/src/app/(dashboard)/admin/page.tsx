import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import { listBackups } from '@/lib/backup';
import { getLogs } from '@/lib/logger';

export default async function AdminDashboard() {
  const session = await auth();
  
  // Only admins can access this
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  // Get system metrics
  const backups = listBackups();
  const recentErrors = getLogs(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    new Date(),
    'error'
  ).slice(-20);

  const dbStats = db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM users) as users,
      (SELECT COUNT(*) FROM clients) as clients,
      (SELECT COUNT(*) FROM patients) as patients,
      (SELECT COUNT(*) FROM employees) as employees,
      (SELECT COUNT(*) FROM invoices) as invoices,
      (SELECT COUNT(*) FROM appointments) as appointments
  `).get() as any;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>⚙️ Panel de Administración</h1>

      {/* System Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: '#e3f2fd', padding: '1.5rem', borderRadius: '0.75rem' }}>
          <div style={{ fontSize: '0.9rem', color: '#1976d2' }}>Usuarios</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1565c0' }}>{dbStats.users}</div>
        </div>
        <div style={{ background: '#f3e5f5', padding: '1.5rem', borderRadius: '0.75rem' }}>
          <div style={{ fontSize: '0.9rem', color: '#7b1fa2' }}>Clientes</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6a1b9a' }}>{dbStats.clients}</div>
        </div>
        <div style={{ background: '#e8f5e9', padding: '1.5rem', borderRadius: '0.75rem' }}>
          <div style={{ fontSize: '0.9rem', color: '#388e3c' }}>Mascotas</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2e7d32' }}>{dbStats.patients}</div>
        </div>
        <div style={{ background: '#fff3e0', padding: '1.5rem', borderRadius: '0.75rem' }}>
          <div style={{ fontSize: '0.9rem', color: '#f57c00' }}>Facturas</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e65100' }}>{dbStats.invoices}</div>
        </div>
      </div>

      {/* Backups Section */}
      <section style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '2rem', border: '1px solid #e0e0e0' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>💾 Backups ({backups.length})</h2>
        
        {backups.length === 0 ? (
          <p style={{ color: '#999' }}>No hay backups disponibles</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Fecha</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>ID</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Tamaño</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Encriptado</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Vence</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '0.75rem' }}>
                      {new Date(backup.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: '#666' }}>
                      {backup.id.slice(0, 20)}...
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      {(backup.size / 1024 / 1024).toFixed(2)} MB
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      {backup.encrypted ? '🔒' : '🔓'}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: '#666' }}>
                      {backup.expiresAt ? new Date(backup.expiresAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recent Errors */}
      <section style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e0e0e0' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>⚠️ Errores Recientes ({recentErrors.length})</h2>
        
        {recentErrors.length === 0 ? (
          <p style={{ color: '#4caf50' }}>✓ Sin errores en los últimos 7 días</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentErrors.slice(-10).map((log, idx) => (
              <div
                key={idx}
                style={{
                  background: '#ffebee',
                  border: '1px solid #ffcdd2',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                }}
              >
                <div style={{ color: '#c62828', fontWeight: 'bold' }}>{log.service}</div>
                <div style={{ color: '#d32f2f', marginTop: '0.25rem' }}>{log.message}</div>
                <div style={{ color: '#999', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '0.5rem', fontSize: '0.9rem' }}>
        <p>📌 Este panel es de administración. Datos actualizados cada vez que se recarga.</p>
      </div>
    </div>
  );
}
