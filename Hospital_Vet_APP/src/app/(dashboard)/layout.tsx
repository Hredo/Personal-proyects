import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  Dog, 
  ClipboardList, 
  Stethoscope, 
  Settings, 
  LogOut,
  Bell,
  Search,
  Package,
  Receipt,
  Calendar,
  Activity,
  Shield
} from 'lucide-react';
import { auth, signOut } from '@/auth';
import { AttendanceControl } from '@/components/AttendanceControl';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="logo" style={{ marginBottom: '1rem' }}>
          <Stethoscope size={24} />
          <span>VetAdmin</span>
        </div>
        
        <nav className="nav-links">
          <Link href="/dashboard" className="nav-link">
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          <Link href="/dashboard/patients" className="nav-link">
            <Dog size={20} />
            Pacientes
          </Link>
          <Link href="/dashboard/hospital/monitor" className="nav-link">
            <Activity size={20} />
            Hospitalización
          </Link>
          <Link href="/dashboard/appointments" className="nav-link">
            <Calendar size={20} />
            Citas y Cirugías
          </Link>
          <Link href="/dashboard/hospital/operating-rooms" className="nav-link">
            <Shield size={20} />
            Gestión Quirófanos
          </Link>
          <Link href="/dashboard/inventory" className="nav-link">
            <Package size={20} />
            Inventario
          </Link>
          <Link href="/dashboard/billing" className="nav-link">
            <Receipt size={20} />
            Facturación
          </Link>
          <Link href="/dashboard/staff" className="nav-link">
            <Users size={20} />
            Personal
          </Link>
        </nav>


        <div style={{ marginTop: 'auto' }}>
          <Link href="#" className="nav-link">
            <Settings size={20} />
            Configuración
          </Link>
          <form action={async () => {
              'use server';
              await signOut();
            }}>
            <button type="submit" className="nav-link" style={{ 
              color: '#ef4444', 
              background: 'none', 
              border: 'none', 
              width: '100%', 
              textAlign: 'left',
              cursor: 'pointer',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '1rem'
            }}>
              <LogOut size={20} />
              Cerrar Sesión
            </button>
          </form>
        </div>
      </aside>

      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', flex: 1 }}>
        <header style={{ 
          height: '70px', 
          borderBottom: '1px solid var(--border)', 
          background: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem'
        }}>
          <div style={{ position: 'relative', width: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Buscar paciente, dueño o ID..." 
              style={{ 
                width: '100%', 
                padding: '0.6rem 1rem 0.6rem 2.5rem', 
                borderRadius: '2rem', 
                border: '1px solid var(--border)',
                background: '#f8fafc',
                outline: 'none'
              }} 
            />
          </div>
          
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            {session?.user?.id && session.user.role !== 'CLIENT' && (
              <AttendanceControl userId={session.user.id} />
            )}
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
              <Bell size={20} />
              <span style={{ 
                position: 'absolute', 
                top: '-2px', 
                right: '-2px', 
                width: '8px', 
                height: '8px', 
                background: '#ef4444', 
                borderRadius: '50%',
                border: '2px solid white'
              }}></span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{session?.user?.name || 'Veterinario'}</p>
                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{session?.user?.role || 'Staff'}</p>
              </div>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                background: 'linear-gradient(45deg, var(--primary), var(--secondary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '700'
              }}>
                {session?.user?.name ? session.user.name.split(' ').map(n => n[0]).join('') : 'V'}
              </div>
            </div>
          </div>
        </header>
        
        <main className="main-content" style={{ overflowY: 'auto', flex: 1, padding: '2rem' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
