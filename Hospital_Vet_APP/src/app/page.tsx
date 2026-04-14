import Link from 'next/link';
import { Heart, ShieldCheck, Users, PawPrint, Activity, PieChart } from 'lucide-react';

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Hero Section */}
      <nav style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
        <div className="logo">
          <Heart size={28} fill="currentColor" />
          <span>VetHospital 24h</span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link href="/login" className="nav-link">Acceso Empleados</Link>
          <Link href="/client-portal" className="btn btn-primary">Portal Clientes</Link>
        </div>
      </nav>

      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0fdfa 0%, #f8fafc 100%)',
        padding: '2rem'
      }}>
        <div style={{ maxWidth: '1200px', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '3.5rem', lineHeight: '1.1', marginBottom: '1.5rem', color: '#134e4a' }}>
              Cuidado experto para <span style={{ color: 'var(--primary-light)' }}>todos</span> los animales.
            </h1>
            <p style={{ fontSize: '1.2rem', color: '#64748b', marginBottom: '2.5rem' }}>
              Gestión profesional 24/7 para hospitales de vanguardia. Desde mascotas domésticas hasta fauna exótica y grandes animales.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link href="/dashboard" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                Ir al Dashboard
              </Link>
              <button className="btn" style={{ border: '1px solid var(--border)', background: 'white', padding: '1rem 2rem', fontSize: '1.1rem' }}>
                Ver Capacidades
              </button>
            </div>
          </div>
          
          <div className="glass-card" style={{ padding: '2rem', background: 'rgba(255,255,255,0.4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <Users color="var(--primary)" size={32} style={{ marginBottom: '0.5rem' }} />
                <h3>Personal</h3>
                <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Gestión completa de turnos y veterinarios.</p>
              </div>
              <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <PawPrint color="var(--primary)" size={32} style={{ marginBottom: '0.5rem' }} />
                <h3>Pacientes</h3>
                <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Historiales médicos de todas las especies.</p>
              </div>
              <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <Activity color="var(--primary)" size={32} style={{ marginBottom: '0.5rem' }} />
                <h3>Hospital</h3>
                <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Monitorización en tiempo real de internos.</p>
              </div>
              <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <ShieldCheck color="var(--primary)" size={32} style={{ marginBottom: '0.5rem' }} />
                <h3>Clientes</h3>
                <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Acceso seguro y transparente para dueños.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid var(--border)', background: 'white' }}>
        <p style={{ color: '#94a3b8' }}>&copy; 2024 VetHospital 24h Systems. Diseñado para la excelencia animal.</p>
      </footer>
    </main>
  );
}
