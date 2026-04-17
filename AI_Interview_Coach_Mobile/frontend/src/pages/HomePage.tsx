import { useState } from 'react';
import { login, register } from '../lib/api';
import { AuthState } from '../lib/types';
import './HomePage.css';

export function HomePage({ onAuth }: { onAuth: (auth: AuthState) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Escribe un nombre de usuario');
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
        ? await login({ username: username.trim(), password })
        : await register({ username: username.trim(), password });

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
        <section className="hero">
          <span className="badge">AI Interview Coach</span>
          <h1>Prepárate con una experiencia clara, rápida y profesional</h1>
          <p>
            Registro, historial, feedback estructurado y un panel visual pensado para que
            cualquiera pueda avanzar sin pelearse con la interfaz.
          </p>

          <div className="feature-grid">
            <article className="feature-card">
              <strong>Login seguro</strong>
              <span>Usuario y contraseña con token persistente.</span>
            </article>
            <article className="feature-card">
              <strong>Historial guardado</strong>
              <span>Tu conversación y tus sesiones quedan en la base de datos.</span>
            </article>
            <article className="feature-card">
              <strong>Feedback útil</strong>
              <span>Rúbricas, progreso y mejoras accionables en cada sesión.</span>
            </article>
          </div>
        </section>

        <section className="auth-panel">
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
              Usuario
              <input
                type="text"
                placeholder="tu_usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                autoComplete="username"
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
