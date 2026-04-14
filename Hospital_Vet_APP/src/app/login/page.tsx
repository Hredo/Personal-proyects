'use client'

import { Stethoscope, Lock, Mail } from 'lucide-react';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { login } from '@/lib/auth-actions';
import { useState } from 'react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="btn btn-primary" 
      style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', border: 'none', opacity: pending ? 0.7 : 1 }}
    >
      {pending ? 'Iniciando sesión...' : 'Iniciar Sesión'}
    </button>
  );
}

export default function LoginPage() {
  const [error, setError] = useState<any>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0fdfa 0%, #f8fafc 100%)',
      padding: '2rem'
    }}>
      <div className="glass-card" style={{ 
        width: '100%', 
        maxWidth: '450px', 
        padding: '3rem',
        background: 'white',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '16px', 
            background: 'rgba(15, 118, 110, 0.1)', 
            color: 'var(--primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <Stethoscope size={32} />
          </div>
          <h1 style={{ fontSize: '1.8rem' }}>Bienvenido de nuevo</h1>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Acceso al sistema Hospital Vet</p>
        </div>

        {typeof error === 'string' && (
          <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                name="email"
                type="email" 
                placeholder="nombre@ejemplo.com"
                required
                style={{ 
                  width: '100%', 
                  padding: '0.75rem 1rem 0.75rem 2.5rem', 
                  borderRadius: '0.5rem', 
                  border: error?.email ? '1px solid #ef4444' : '1px solid var(--border)',
                  outline: 'none'
                }} 
              />
            </div>
            {error?.email && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>{error.email[0]}</p>}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                name="password"
                type="password" 
                placeholder="••••••••"
                required
                style={{ 
                  width: '100%', 
                  padding: '0.75rem 1rem 0.75rem 2.5rem', 
                  borderRadius: '0.5rem', 
                  border: error?.password ? '1px solid #ef4444' : '1px solid var(--border)',
                  outline: 'none'
                }} 
              />
            </div>
            {error?.password && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>{error.password[0]}</p>}
            <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
              <Link href="#" style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none' }}>¿Olvidaste tu contraseña?</Link>
            </div>
          </div>

          <SubmitButton />

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              ¿No tienes cuenta? <Link href="/register" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>Regístrate aquí</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

