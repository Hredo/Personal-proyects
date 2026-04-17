import { useEffect, useMemo, useState } from 'react';
import { getHistory, getProgress, startSession, submitSessionAnswer } from '../lib/api';
import { AuthState, Competency, InterviewContext, ProgressResponse, SessionHistoryItem, SessionResponse } from '../lib/types';
import './InterviewPage.css';

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user' | 'system';
  title: string;
  content: string;
};

const emptyContext: InterviewContext = {
  target_role: '',
  company: '',
  education: '',
  experience: '',
  technologies: '',
  goals: '',
  notes: '',
};

const levelOptions = [
  { label: 'Junior', value: 'junior' },
  { label: 'Mid', value: 'mid' },
  { label: 'Senior', value: 'senior' },
];

export function InterviewPage({ auth }: { auth: AuthState }) {
  const [contextDraft, setContextDraft] = useState<InterviewContext>(emptyContext);
  const [level, setLevel] = useState('junior');
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<{
    total_score: number;
    strengths: string[];
    improvements: string[];
    competencies: Competency[];
  } | null>(null);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [history, setHistory] = useState<SessionHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sessionStarted, setSessionStarted] = useState(false);

  const refreshSidebar = async () => {
    try {
      const [historyData, progressData] = await Promise.all([
        getHistory(auth.userId, auth.token),
        getProgress(auth.userId, auth.token),
      ]);
      setHistory(historyData);
      setProgress(progressData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    refreshSidebar();
  }, [auth.userId, auth.token]);

  const canStart = useMemo(() => {
    return Boolean(
      contextDraft.target_role.trim() &&
        contextDraft.company.trim() &&
        contextDraft.education.trim() &&
        contextDraft.experience.trim() &&
        contextDraft.technologies.trim() &&
        contextDraft.goals.trim(),
    );
  }, [contextDraft]);

  const conversation = useMemo<ChatMessage[]>(() => {
    const messages: ChatMessage[] = [
      {
        id: 'system-welcome',
        role: 'system',
        title: 'Asistente',
        content: 'Primero completa el contexto. Después la IA generará preguntas adaptadas a tu perfil.',
      },
    ];

    if (session) {
      messages.push({
        id: session.session_id,
        role: 'assistant',
        title: 'Pregunta generada',
        content: session.question,
      });
    }

    if (answer) {
      messages.push({
        id: `user-answer-${session?.session_id ?? 'draft'}`,
        role: 'user',
        title: 'Tu respuesta',
        content: answer,
      });
    }

    return messages;
  }, [answer, session]);

  const handleContextChange = (field: keyof InterviewContext, value: string) => {
    setContextDraft((current) => ({ ...current, [field]: value }));
  };

  const handleGenerateQuestion = async () => {
    if (!canStart) {
      alert('Completa el contexto antes de generar la entrevista.');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const newSession = await startSession(
        {
          user_id: auth.userId,
          role: contextDraft.target_role,
          level,
          context: contextDraft,
        },
        auth.token,
      );
      setSession(newSession);
      setAnswer('');
      setSessionStarted(true);
      await refreshSidebar();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    if (!session || !answer.trim()) return;

    setLoading(true);
    try {
      const updated = await submitSessionAnswer(session.session_id, answer);
      setSession(updated);
      setResult({
        total_score: updated.total_score || 0,
        strengths: updated.strengths,
        improvements: updated.improvements,
        competencies: updated.competencies || [],
      });
      await refreshSidebar();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadHistoryItem = (item: SessionHistoryItem) => {
    setContextDraft(item.context);
    setLevel(item.level);
    setSession({
      session_id: item.session_id,
      user_id: item.user_id,
      role: item.role,
      level: item.level,
      context: item.context,
      question: item.question,
      answer: item.answer,
      total_score: item.total_score,
      strengths: [],
      improvements: [],
      competencies: [],
      status: item.status,
    });
    setAnswer(item.answer ?? '');
    setSessionStarted(true);
    setResult(null);
  };

  return (
    <div className="interview-page">
      <div className="page-shell chat-shell">
        <aside className="chat-sidebar card-glass">
          <div className="sidebar-header">
            <div>
              <span className="eyebrow">Historial</span>
              <h3>Conversaciones</h3>
            </div>
            <span className="pill subtle">{loadingHistory ? '...' : `${history.length}`}</span>
          </div>

          <div className="sidebar-history">
            {history.length === 0 ? (
              <p className="empty-history">Todavía no hay entrevistas guardadas.</p>
            ) : (
              history.slice(0, 10).map((item) => (
                <button key={item.session_id} className="history-tile" onClick={() => handleLoadHistoryItem(item)}>
                  <strong>{item.context.target_role}</strong>
                  <span>{item.context.company}</span>
                  <small>{item.total_score ?? '—'}/100 · {new Date(item.updated_at).toLocaleDateString()}</small>
                </button>
              ))
            )}
          </div>
        </aside>

        <main className="chat-main">
          <section className="page-hero card-glass">
            <div>
              <span className="eyebrow">Simulación técnica</span>
              <h1>Entrevista adaptada a tu contexto real</h1>
              <p>
                Cuéntale al sistema a qué puesto aplicas, en qué empresa, qué has estudiado y qué experiencia tienes.
                La IA generará preguntas coherentes con ese perfil.
              </p>
            </div>
            <button onClick={handleGenerateQuestion} disabled={loading} className="btn-primary">
              {loading ? 'Generando...' : sessionStarted ? 'Nueva pregunta' : 'Empezar entrevista'}
            </button>
          </section>

          <section className="card context-card animate-in">
            <div className="context-grid">
              <label>
                Puesto objetivo
                <input value={contextDraft.target_role} onChange={(e) => handleContextChange('target_role', e.target.value)} placeholder="Frontend Engineer" />
              </label>
              <label>
                Empresa
                <input value={contextDraft.company} onChange={(e) => handleContextChange('company', e.target.value)} placeholder="Acme Corp" />
              </label>
              <label>
                Formación
                <input value={contextDraft.education} onChange={(e) => handleContextChange('education', e.target.value)} placeholder="Ingeniería Informática" />
              </label>
              <label>
                Experiencia
                <input value={contextDraft.experience} onChange={(e) => handleContextChange('experience', e.target.value)} placeholder="2 años en React y Node" />
              </label>
              <label>
                Tecnologías
                <input value={contextDraft.technologies} onChange={(e) => handleContextChange('technologies', e.target.value)} placeholder="React, TypeScript, FastAPI" />
              </label>
              <label>
                Objetivo
                <input value={contextDraft.goals} onChange={(e) => handleContextChange('goals', e.target.value)} placeholder="Quiero practicar entrevistas de seniority media" />
              </label>
              <label className="full-width">
                Notas opcionales
                <textarea value={contextDraft.notes} onChange={(e) => handleContextChange('notes', e.target.value)} placeholder="Añade detalles que ayuden a personalizar la entrevista..." rows={3} />
              </label>
              <div className="level-switch full-width">
                {levelOptions.map((item) => (
                  <button key={item.value} type="button" className={level === item.value ? 'active' : ''} onClick={() => setLevel(item.value)}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="chat-window card-glass">
            <div className="chat-stream">
              {conversation.map((message) => (
                <article key={message.id} className={`chat-bubble ${message.role}`}>
                  <span className="bubble-role">{message.title}</span>
                  <p>{message.content}</p>
                </article>
              ))}
            </div>

            {session && (
              <div className="answer-composer">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Escribe tu respuesta aquí con claridad, estructura y trade-offs..."
                  rows={7}
                />
                <div className="composer-actions">
                  <span className="helper-text">Mínimo 10 caracteres para evaluar.</span>
                  <button
                    onClick={handleEvaluate}
                    disabled={loading || answer.trim().length < 10}
                    className="btn-primary"
                  >
                    {loading ? 'Evaluando...' : 'Enviar respuesta'}
                  </button>
                </div>
              </div>
            )}
          </section>

          {result && (
            <section className="card result animate-in delay-2">
              <div className="result-header">
                <div>
                  <span className="eyebrow">Resultado</span>
                  <h3>Score total: {result.total_score}/100</h3>
                </div>
                <div className="score-badge">{result.total_score}</div>
              </div>

              {result.competencies.length > 0 && (
                <div className="competencies">
                  <h4>Evaluación por competencia</h4>
                  <div className="competencies-grid">
                    {result.competencies.map((comp) => (
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
                    {result.strengths.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>Mejoras</h4>
                  <ul>
                    {result.improvements.map((item) => (
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
