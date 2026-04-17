import { useState } from 'react';
import { HomePage } from './pages/HomePage';
import { InterviewPage } from './pages/InterviewPage';
import { DashboardPage } from './pages/DashboardPage';
import { AuthState } from './lib/types';
import './App.css';

function App() {
  const [authState, setAuthState] = useState<AuthState | null>(() => {
    const stored = localStorage.getItem('authState');
    if (!stored) {
      return null;
    }

    try {
      const parsed = JSON.parse(stored) as AuthState & { user_id?: string; username?: string };
      const normalized = {
        userId: parsed.userId || parsed.user_id || '',
        email: parsed.email || parsed.username || '',
        token: parsed.token,
      };

      if (!normalized.userId || !normalized.email || !normalized.token) {
        localStorage.removeItem('authState');
        return null;
      }

      return normalized;
    } catch {
      return null;
    }
  });
  const [currentPage, setCurrentPage] = useState<'interview' | 'dashboard'>('interview');
  const displayName = authState?.email ? authState.email.split('@')[0] : '';

  const handleAuth = (state: AuthState) => {
    localStorage.setItem('authState', JSON.stringify(state));
    setAuthState(state);
    setCurrentPage('interview');
  };

  const handleLogout = () => {
    localStorage.removeItem('authState');
    setAuthState(null);
    setCurrentPage('interview');
  };

  return (
    <div className="app">
      {!authState ? (
        <HomePage onAuth={handleAuth} />
      ) : (
        <>
          <header className="header">
            <div className="app-title-block">
              <h1>Interview Coach</h1>
              <p>Simulador de entrevistas técnicas con IA</p>
            </div>
            <nav className="nav-tabs">
              <button
                className={`nav-tab ${currentPage === 'interview' ? 'active' : ''}`}
                onClick={() => setCurrentPage('interview')}
              >
                Entrevista
              </button>
              <button
                className={`nav-tab ${currentPage === 'dashboard' ? 'active' : ''}`}
                onClick={() => setCurrentPage('dashboard')}
              >
                Progreso
              </button>
            </nav>
            <div className="header-user-actions">
              <span className="user-chip" title={authState.email}>{displayName}</span>
              <button onClick={handleLogout} className="btn-logout" type="button">
                Salir
              </button>
            </div>
          </header>
          {currentPage === 'interview' ? (
            <InterviewPage auth={authState} />
          ) : (
            <DashboardPage auth={authState} />
          )}
        </>
      )}
    </div>
  );
}

export default App;
