import { useState } from 'react';
import { login, register } from '../lib/api';
import { AuthState } from '../lib/types';
import './HomePage.css';

export function HomePage({ onAuth }: { onAuth: (auth: AuthState) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const valueProps = ['Gemini', 'Correo', 'Historial'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Escribe un correo electrónico');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Escribe un correo electrónico válido');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const auth = mode === 'login'
        ? await login({ email: email.trim(), password })
        : await register({ email: email.trim(), password });

      onAuth(auth);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <div className="aurora aurora-one" />
      <div className="aurora aurora-two" />
      <div className="home-grid">
        <section className="hero card-glass">
          <span className="badge">AI Interview Coach</span>
          <h1>Interfaz limpia para practicar entrevistas con Gemini</h1>
          <p>Acceso propio con correo. Historial guardado. Feedback sin ruido.</p>

          <div className="value-strip">
            {valueProps.map((item) => (
              <span key={item} className="value-chip">{item}</span>
            ))}
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <strong>Claro</strong>
              <span>Menos pasos, más práctica.</span>
            </article>
            <article className="feature-card">
              <strong>Útil</strong>
              <span>Contexto, pregunta y evaluación.</span>
            </article>
            <article className="feature-card">
              <strong>Rápido</strong>
              <span>Arranca con correo y contraseña.</span>
            </article>
          </div>
        </section>

        <section className="auth-panel card-glass animate-in delay-1">
          <div className="auth-toggle">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')} type="button">
              Entrar
            </button>
            <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')} type="button">
              Crear cuenta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="form card-glass">
            <label>
              Correo electrónico
              <input
                type="email"
                placeholder="tu_correo@dominio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                autoComplete="email"
              />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </label>
            {mode === 'register' && (
              <label>
                Confirmar contraseña
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input"
                  autoComplete="new-password"
                />
              </label>
            )}
            {error && <p className="error">{error}</p>}
            <button type="submit" className="btn-start" disabled={loading}>
              {loading ? 'Procesando...' : mode === 'login' ? 'Entrar al panel' : 'Crear cuenta y entrar'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
