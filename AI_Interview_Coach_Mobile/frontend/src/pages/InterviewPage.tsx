import { useEffect, useState } from 'react';
import { deleteSession, evaluateSession, getHistory, getSession, startSession, submitSessionAnswer } from '../lib/api';
import { AuthState, InterviewContext, SessionHistoryItem, SessionResponse } from '../lib/types';
import './InterviewPage.css';

const defaultContext: InterviewContext = {
  target_role: 'Sin definir por el usuario',
  company: 'No especificada por el usuario',
  summary: 'Contexto pendiente: la IA debe preguntar primero el tema de la entrevista.',
  notes: '',
  education: '',
  experience: '',
  technologies: '',
  goals: '',
};

export function InterviewPage({ auth }: { auth: AuthState }) {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [history, setHistory] = useState<SessionHistoryItem[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [uiError, setUiError] = useState<string>('');

  const refreshSidebar = async () => {
    try {
      const historyData = await getHistory(auth.userId, auth.token);
      setHistory(historyData);
    } catch (err) {
      console.error(err);
      setUiError((err as Error).message || 'No se pudo cargar el historial.');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    refreshSidebar();
  }, [auth.userId, auth.token]);

  const handleStartInterview = async (topic: string) => {
    const cleanTopic = topic.trim();
    if (cleanTopic.length < 2) {
      setUiError('Escribe un tema válido para empezar.');
      return;
    }

    setUiError('');
    setLoadingChat(true);
    try {
      const newSession = await startSession(
        {
          user_id: auth.userId,
          role: cleanTopic ? cleanTopic.slice(0, 50) : 'Entrevista abierta',
          level: 'mid',
          context: cleanTopic
            ? {
                ...defaultContext,
                target_role: cleanTopic,
                summary: `Tema elegido por el candidato: ${cleanTopic}`,
              }
            : defaultContext,
        },
        auth.token,
      );
      setSession(newSession);
      await refreshSidebar();
    } catch (err) {
      setUiError((err as Error).message || 'No se pudo iniciar la entrevista.');
    } finally {
      setLoadingChat(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || session?.status === 'completed') {
      return;
    }

    const content = messageInput.trim();
    setUiError('');

    if (!session) {
      setMessageInput('');
      await handleStartInterview(content);
      return;
    }

    setLoadingChat(true);
    try {
      const updated = await submitSessionAnswer(session.session_id, content);
      setSession(updated);
      setMessageInput('');
      await refreshSidebar();
    } catch (err) {
      setUiError((err as Error).message || 'No se pudo enviar el mensaje.');
    } finally {
      setLoadingChat(false);
    }
  };

  const handleEvaluateInterview = async () => {
    if (!session) {
      return;
    }

    setLoadingChat(true);
    try {
      const evaluated = await evaluateSession(session.session_id);
      setSession(evaluated);
      await refreshSidebar();
    } catch (err) {
      setUiError((err as Error).message || 'No se pudo evaluar la entrevista.');
    } finally {
      setLoadingChat(false);
    }
  };

  const handleLoadHistoryItem = async (item: SessionHistoryItem) => {
    setLoadingChat(true);
    try {
      const fullSession = await getSession(item.session_id, auth.token);
      setSession(fullSession);
      setUiError('');
    } catch (err) {
      setUiError((err as Error).message || 'No se pudo abrir esta entrevista.');
    } finally {
      setLoadingChat(false);
    }
  };

  const handleDeleteHistoryItem = async (sessionId: string) => {
    const confirmed = window.confirm('¿Quieres borrar esta conversación?');
    if (!confirmed) {
      return;
    }

    try {
      await deleteSession(sessionId, auth.token);
      if (session?.session_id === sessionId) {
        setSession(null);
        setMessageInput('');
      }
      await refreshSidebar();
    } catch (err) {
      setUiError((err as Error).message || 'No se pudo borrar la entrevista.');
    }
  };

  const handleResetToTopicStep = () => {
    setSession(null);
    setMessageInput('');
    setUiError('');
  };

  return (
    <div className="interview-page">
      <div className="page-shell chat-shell">
        <aside className="chat-sidebar card-glass">
          <div className="sidebar-header">
            <div>
              <span className="eyebrow">Historial</span>
              <h3>Entrevistas</h3>
            </div>
            <span className="pill subtle">{loadingHistory ? '...' : `${history.length}`}</span>
          </div>

          <div className="sidebar-history">
            {history.length === 0 ? (
              <p className="empty-history">Todavía no hay entrevistas guardadas.</p>
            ) : (
              history.slice(0, 10).map((item) => (
                <div key={item.session_id} className="history-tile-wrap">
                  <button className="history-tile" onClick={() => handleLoadHistoryItem(item)}>
                    <strong>{item.context.target_role || 'Tema por definir'}</strong>
                    <span>{item.context.company || 'Sin empresa indicada'}</span>
                    <small>{item.total_score ?? '—'}/100 · {new Date(item.updated_at).toLocaleDateString()}</small>
                  </button>
                  <button className="history-delete" onClick={() => handleDeleteHistoryItem(item.session_id)} type="button">
                    Borrar
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        <main className="chat-main">
          <section className="chat-window card-glass">
            <div className="chat-topline">
              <span className="eyebrow">Entrevista continua</span>
              <button onClick={handleResetToTopicStep} disabled={loadingChat} className="btn-primary" type="button">
                Nueva entrevista
              </button>
            </div>
            {uiError && <div className="inline-error">{uiError}</div>}
            <div className="chat-stream">
              {!session ? (
                <div className="empty-chat animate-in">
                  <span className="eyebrow">Primero, el tema</span>
                  <h3>¿Sobre qué quieres la entrevista?</h3>
                  <p>Escribe el puesto o área (por ejemplo: backend Python, data analyst, frontend React).</p>
                </div>
              ) : (
                session.messages.map((message, index) => (
                  <article key={`${message.role}-${index}`} className={`chat-bubble ${message.role}`}>
                    <span className="bubble-role">{message.title}</span>
                    <p>{message.content}</p>
                  </article>
                ))
              )}
            </div>

            <div className="answer-composer">
              <textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={session ? 'Escribe tu respuesta...' : 'Escribe el tema de la entrevista...'}
                rows={4}
                disabled={session?.status === 'completed' || loadingChat}
              />
              <div className="composer-actions">
                <span className="helper-text">
                  {session?.status === 'completed'
                    ? 'Entrevista evaluada. Inicia otra sesión para seguir practicando.'
                    : session
                      ? 'Pulsa enviar para continuar o evaluar para cerrar la entrevista.'
                      : 'Pulsa enviar para empezar la entrevista con ese tema.'}
                </span>
                {session && (
                  <button
                    onClick={handleEvaluateInterview}
                    disabled={loadingChat || session.status === 'completed'}
                    className="btn-secondary"
                    type="button"
                  >
                    {loadingChat ? 'Procesando...' : session.status === 'completed' ? 'Evaluada' : 'Evaluar entrevista'}
                  </button>
                )}
                <button
                  onClick={handleSendMessage}
                  disabled={loadingChat || messageInput.trim().length < 2 || session?.status === 'completed'}
                  className="btn-primary"
                  type="button"
                >
                  {loadingChat ? 'Enviando...' : session ? 'Enviar' : 'Empezar'}
                </button>
              </div>
            </div>
          </section>

          {session && session.status === 'completed' && session.total_score !== null && (
            <section className="card result animate-in delay-2">
              <div className="result-header">
                <div>
                  <span className="eyebrow">Resultado</span>
                  <h3>Score: {session.total_score}/100</h3>
                </div>
                <div className="score-badge">{session.total_score}</div>
              </div>

              {session.competencies.length > 0 && (
                <div className="competencies">
                  <h4>Evaluación por competencia</h4>
                  <div className="competencies-grid">
                    {session.competencies.map((comp) => (
                      <div key={comp.name} className="competency-item">
                        <div className="competency-name">{comp.name}</div>
                        <div className="competency-bar">
                          <div
                            className="competency-fill"
                            style={{
                              width: `${comp.percentage}%`,
                              backgroundColor:
                                comp.percentage >= 80
                                  ? '#4caf50'
                                  : comp.percentage >= 60
                                    ? '#ff9800'
                                    : '#f44336',
                            }}
                          />
                        </div>
                        <div className="competency-score">
                          {comp.score}/{comp.max_score}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="result-grid">
                <div>
                  <h4>Fortalezas</h4>
                  <ul>
                    {session.strengths.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>Mejoras</h4>
                  <ul>
                    {session.improvements.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
