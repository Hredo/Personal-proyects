import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { getHistory, getProgress } from '../lib/api';
import { generateProgressPDF } from '../lib/pdf';
import { AuthState, ProgressResponse, SessionHistoryItem } from '../lib/types';
import './DashboardPage.css';

export function DashboardPage({ auth }: { auth: AuthState }) {
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [history, setHistory] = useState<SessionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [progressData, historyData] = await Promise.all([
          getProgress(auth.userId, auth.token),
          getHistory(auth.userId, auth.token),
        ]);
        setProgress(progressData);
        setHistory(historyData);
      } catch (err) {
        console.error('Error fetching progress:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [auth.userId, auth.token]);

  const handleExportPDF = async () => {
    if (!progress) return;
    setExporting(true);
    try {
      await generateProgressPDF(auth.userId, progress);
    } catch (err) {
      alert('Error al exportar PDF');
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading card-glass">Cargando progreso...</div>
      </div>
    );
  }

  const scoresData = (progress?.latest_scores || [])
    .map((score, idx) => ({
      name: `Sesión ${idx + 1}`,
      score,
    }))
    .reverse();

  const competencyData = [
    { name: 'Architecture', value: 25 },
    { name: 'Complexity', value: 25 },
    { name: 'Communication', value: 25 },
    { name: 'Problem-Solving', value: 25 },
  ];

  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

  return (
    <div className="dashboard-page">
      <div className="page-shell">
        <section className="page-hero card-glass dashboard-hero">
          <div>
            <span className="eyebrow">Panel de progreso</span>
            <h1>Tu evolución queda guardada y se entiende de un vistazo</h1>
            <p>
              Revisa tendencias, detecta focos de mejora y exporta un resumen profesional en PDF.
            </p>
          </div>
          <button className="btn-export-pdf" onClick={handleExportPDF} disabled={exporting || !progress}>
            {exporting ? 'Exportando...' : '📥 Exportar PDF'}
          </button>
        </section>

        {!progress || progress.sessions_completed === 0 ? (
          <div className="card empty-state">
            <h3>Sin sesiones todavía</h3>
            <p>Cuando completes tu primera entrevista verás aquí tus gráficos, tu histórico y tus puntos de mejora.</p>
          </div>
        ) : (
          <>
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-label">Sesiones completadas</div>
                <div className="kpi-value">{progress.sessions_completed}</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">Score promedio</div>
                <div className="kpi-value">{progress.average_score.toFixed(1)}</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">Score máximo</div>
                <div className="kpi-value">{Math.max(...progress.latest_scores)}</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">Score mínimo</div>
                <div className="kpi-value">{Math.min(...progress.latest_scores)}</div>
              </div>
            </div>

            <div className="chart-card chart-hero">
              <h3>Tendencia de scores</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={scoresData} margin={{ top: 5, right: 24, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#cbd5e1" />
                  <YAxis stroke="#cbd5e1" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '0.75rem',
                    }}
                    labelStyle={{ color: '#f8fafc' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#22c55e"
                    strokeWidth={3}
                    dot={{ fill: '#22c55e', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="charts-grid">
              <div className="chart-card">
                <h3>Distribución de competencias</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={competencyData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name }) => `${name} 25%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card focus-areas">
                <h3>Áreas de mejora frecuentes</h3>
                {progress.focus_areas.length > 0 ? (
                  <ul className="focus-list">
                    {progress.focus_areas.map((area, idx) => (
                      <li key={idx} className="focus-item">
                        <span className="focus-badge">{idx + 1}</span>
                        <span className="focus-text">{area}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>¡Excelente! No hay áreas de mejora identificadas.</p>
                )}
              </div>
            </div>

            <div className="chart-card">
              <h3>Histórico de sesiones</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={scoresData} margin={{ top: 5, right: 24, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#cbd5e1" />
                  <YAxis stroke="#cbd5e1" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                    }}
                  />
                  <Bar dataKey="score" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card history-section">
              <h3>Conversaciones guardadas</h3>
              <div className="history-list">
                {history.slice(0, 8).map((item) => (
                  <article key={item.session_id} className="history-item">
                    <div className="history-item-top">
                      <strong>{item.role} · {item.level}</strong>
                      <span>{item.total_score ?? '—'}/100</span>
                    </div>
                    <p>{item.question}</p>
                    <small>{new Date(item.updated_at).toLocaleString()}</small>
                  </article>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
