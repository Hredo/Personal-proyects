'use client'

import { Stethoscope, Lock, Mail, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { register } from '@/lib/auth-actions';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="btn btn-primary" 
      style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', opacity: pending ? 0.7 : 1 }}
    >
      {pending ? 'Creando cuenta...' : 'Crear Cuenta'}
    </button>
  );
}

export default function RegisterPage() {
  const [error, setError] = useState<any>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    const result = await register(formData);
    
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess("¡Cuenta creada! Redirigiendo al login...");
      setTimeout(() => {
        router.push('/login');
      }, 2000);
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
          <h1 style={{ fontSize: '1.8rem' }}>Únete a Hospital Vet</h1>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Regístrate para gestionar a tus mascotas</p>
        </div>

        {success && (
          <div style={{ padding: '0.75rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '0.5rem', marginBottom: '1rem', textAlign: 'center' }}>
            {success}
          </div>
        )}

        <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Nombre Completo</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                name="name"
                type="text" 
                placeholder="Juan Pérez"
                required
                style={{ 
                  width: '100%', 
                  padding: '0.75rem 1rem 0.75rem 2.5rem', 
                  borderRadius: '0.5rem', 
                  border: error?.name ? '1px solid #ef4444' : '1px solid var(--border)',
                  outline: 'none'
                }} 
              />
            </div>
            {error?.name && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>{error.name[0]}</p>}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                name="email"
                type="email" 
                placeholder="juan@ejemplo.com"
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
          </div>

          <SubmitButton />

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              ¿Ya tienes una cuenta? <Link href="/login" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>Inicia Sesión</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
