import Link from 'next/link';
import { Heart, User, LogOut, Bell } from 'lucide-react';
import { auth, signOut } from '@/auth';

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <nav style={{ 
        background: 'white', 
        borderBottom: '1px solid var(--border)', 
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <Link href="/client-portal" className="logo" style={{ textDecoration: 'none' }}>
          <Heart size={24} fill="currentColor" />
          <span>VetPortal</span>
        </Link>
        
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <button style={{ background: 'none', border: 'none', color: '#64748b' }}>
            <Bell size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid var(--border)', paddingLeft: '1.5rem' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{session?.user?.name || 'Cliente'}</p>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Propietario</p>
            </div>
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '50%', 
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}>
              <User size={20} />
            </div>
          </div>
          <form action={async () => {
              'use server';
              await signOut();
            }}>
            <button type="submit" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
              <LogOut size={20} />
            </button>
          </form>
        </div>
      </nav>
      
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        {children}
      </main>
    </div>
  );
}
