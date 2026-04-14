import db from '@/lib/db';
import Link from 'next/link';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, MapPin, Play } from 'lucide-react';
import { NewAppointmentButton, AppointmentStatusButtons, AppointmentDetailModal } from '@/components/AppointmentActions';

function getStatusStyle(status: string) {
  switch (status) {
    case 'COMPLETED': return { bg: '#dcfce7', color: '#166534', label: 'Completada' };
    case 'CANCELLED': return { bg: '#fee2e2', color: '#991b1b', label: 'Cancelada' };
    case 'SCHEDULED':  return { bg: '#dbeafe', color: '#1e40af', label: 'Programada' };
    case 'IN_PROGRESS': return { bg: '#fef9c3', color: '#854d0e', label: 'En curso' };
    default:           return { bg: '#f1f5f9', color: '#374151', label: status };
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case 'Cirugía':  return '#ef4444';
    case 'Urgencia': return '#f97316';
    default:         return 'var(--primary)';
  }
}

export default async function AppointmentsPage({
  searchParams
}: {
  searchParams?: Promise<{ month?: string; day?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const patients: any[] = db.prepare(`SELECT id, name, species FROM patients ORDER BY name`).all();

  const appointments: any[] = db.prepare(`
    SELECT a.*, p.name as patientName, p.species as patientSpecies
    FROM appointments a
    JOIN patients p ON a.patientId = p.id
    ORDER BY a.dateTime ASC
  `).all();

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const selectedMonth = /^\d{4}-\d{2}$/.test(params.month ?? '')
    ? `${params.month}-01`
    : `${todayStr.slice(0, 7)}-01`;
  const selectedMonthDate = new Date(`${selectedMonth}T00:00:00`);
  const selectedDay = /^\d{4}-\d{2}-\d{2}$/.test(params.day ?? '') ? params.day! : todayStr;

  const todayApps = appointments.filter(a => a.dateTime?.startsWith(todayStr) && (a.status === 'SCHEDULED' || a.status === 'IN_PROGRESS'));
  const upcoming  = appointments.filter(a => a.dateTime > now.toISOString().replace('T', ' ') && a.status === 'SCHEDULED');
  const recent    = appointments.filter(a => a.status === 'COMPLETED' || a.status === 'CANCELLED').slice(0, 8);

  // Build calendar day mappings for selected month
  const year = selectedMonthDate.getFullYear();
  const month = selectedMonthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const selectedMonthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  const prevMonthDate = new Date(year, month - 1, 1);
  const nextMonthDate = new Date(year, month + 1, 1);
  const prevMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const nextMonth = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const monthAppointments = appointments.filter(a => String(a.dateTime).startsWith(selectedMonthKey));
  const daySummary: Record<string, { total: number; inProgress: number; completed: number }> = {};

  for (const app of monthAppointments) {
    const day = String(app.dateTime).slice(0, 10);
    if (!daySummary[day]) {
      daySummary[day] = { total: 0, inProgress: 0, completed: 0 };
    }
    daySummary[day].total += 1;
    if (app.status === 'IN_PROGRESS') daySummary[day].inProgress += 1;
    if (app.status === 'COMPLETED') daySummary[day].completed += 1;
  }

  const selectedDayAppointments = appointments
    .filter(a => String(a.dateTime).startsWith(selectedDay))
    .sort((a, b) => String(a.dateTime).localeCompare(String(b.dateTime)));

  return (
    <div style={{ display: 'flex', gap: '2rem' }}>
      {/* Left column: calendar + upcoming */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem' }}>Citas y Cirugías</h1>
            <p style={{ color: '#64748b' }}>{upcoming.length} citas programadas próximamente.</p>
          </div>
          <NewAppointmentButton patients={patients} />
        </header>

        {/* Calendar */}
        <div className="glass-card" style={{ background: 'white', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem' }}>
              {selectedMonthDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link href={`/dashboard/appointments?month=${prevMonth}&day=${selectedDay}`} className="btn" style={{ padding: '0.5rem', border: '1px solid var(--border)', background: 'white', display: 'inline-flex' }}><ChevronLeft size={18} /></Link>
              <Link href={`/dashboard/appointments?month=${nextMonth}&day=${selectedDay}`} className="btn" style={{ padding: '0.5rem', border: '1px solid var(--border)', background: 'white', display: 'inline-flex' }}><ChevronRight size={18} /></Link>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '999px', padding: '0.2rem 0.55rem' }}>
              Total mes: {monthAppointments.length}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#854d0e', background: '#fef9c3', borderRadius: '999px', padding: '0.2rem 0.55rem' }}>
              En curso: {monthAppointments.filter(a => a.status === 'IN_PROGRESS').length}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#166534', background: '#dcfce7', borderRadius: '999px', padding: '0.2rem 0.55rem' }}>
              Completadas: {monthAppointments.filter(a => a.status === 'COMPLETED').length}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', borderRadius: '0.5rem', overflow: 'hidden' }}>
            {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map(d => (
              <div key={d} style={{ background: '#f8fafc', padding: '0.6rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>{d}</div>
            ))}
            {/* Empty cells offset for month start */}
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`e${i}`} style={{ background: '#fafafa', minHeight: '60px' }} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayKey = `${selectedMonthKey}-${String(day).padStart(2, '0')}`;
              const isToday = dayKey === todayStr;
              const isSelected = dayKey === selectedDay;
              const summary = daySummary[dayKey];
              const hasCita = !!summary?.total;
              return (
                <Link
                  key={day}
                  href={`/dashboard/appointments?month=${selectedMonthKey}&day=${dayKey}`}
                  style={{
                    background: isSelected ? '#ecfeff' : 'white',
                    minHeight: '72px',
                    padding: '0.45rem',
                    position: 'relative',
                    border: isSelected ? '2px solid var(--primary)' : isToday ? '2px solid #bae6fd' : '1px solid #f1f5f9',
                    textDecoration: 'none'
                  }}
                >
                  <span style={{ fontSize: '0.8rem', fontWeight: isSelected || isToday ? '700' : '500', color: isSelected || isToday ? 'var(--primary)' : '#374151' }}>{day}</span>
                  {hasCita && (
                    <>
                      <div style={{ fontSize: '0.7rem', marginTop: '0.35rem', color: '#0f766e', fontWeight: '700' }}>{summary.total} cita{summary.total > 1 ? 's' : ''}</div>
                      {summary.inProgress > 0 && <div style={{ fontSize: '0.65rem', color: '#854d0e' }}>En curso ahora</div>}
                    </>
                  )}
                </Link>
              );
            })}
          </div>

          <div style={{ marginTop: '1rem', background: '#f8fafc', borderRadius: '0.6rem', padding: '0.9rem' }}>
            <p style={{ fontSize: '0.8rem', color: '#334155', fontWeight: '700', marginBottom: '0.5rem' }}>
              Agenda del {new Date(`${selectedDay}T00:00:00`).toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long' })}
            </p>
            {selectedDayAppointments.length === 0 ? (
              <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Sin citas para este día.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {selectedDayAppointments.map(a => {
                  const st = getStatusStyle(a.status);
                  return (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', borderRadius: '0.45rem', padding: '0.45rem 0.6rem' }}>
                      <div>
                        <p style={{ fontSize: '0.78rem', fontWeight: '700', color: '#0f172a' }}>{new Date(a.dateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} · {a.patientName}</p>
                        <p style={{ fontSize: '0.72rem', color: '#64748b' }}>{a.type} · {a.reason}</p>
                      </div>
                      <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem', borderRadius: '999px', background: st.bg, color: st.color, fontWeight: '700' }}>{st.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming appointments table */}
        <div className="glass-card" style={{ background: 'white', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Próximas Citas ({upcoming.length})</h2>
          {upcoming.length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>No hay citas programadas.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                  {['FECHA / HORA', 'PACIENTE', 'TIPO / MOTIVO', 'ESTADO', 'ACCIONES'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 0.5rem', color: '#64748b', fontWeight: '500', fontSize: '0.8rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {upcoming.map(a => {
                  const st = getStatusStyle(a.status);
                  return (
                    <tr key={a.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '0.9rem 0.5rem' }}>
                        <p style={{ fontWeight: '600', fontSize: '0.85rem' }}>{new Date(a.dateTime).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</p>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(a.dateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td style={{ padding: '0.9rem 0.5rem' }}>
                        <p style={{ fontWeight: '600', fontSize: '0.85rem' }}>{a.patientName}</p>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{a.patientSpecies}</p>
                      </td>
                      <td style={{ padding: '0.9rem 0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '0.3rem', background: '#f1f5f9', color: getTypeColor(a.type), fontWeight: '600' }}>{a.type}</span>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>{a.reason}</p>
                      </td>
                      <td style={{ padding: '0.9rem 0.5rem' }}>
                        <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '2rem', background: st.bg, color: st.color, fontWeight: '600' }}>{st.label}</span>
                      </td>
                      <td style={{ padding: '0.9rem 0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <AppointmentDetailModal appointment={a} />
                          <AppointmentStatusButtons appointmentId={a.id} currentStatus={a.status} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Right sidebar */}
      <div style={{ width: '310px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Today agenda */}
        <section className="glass-card" style={{ background: 'white', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={16} color="var(--primary)" />
            Agenda de Hoy ({todayApps.length})
          </h2>
          {todayApps.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem' }}>Sin citas para hoy.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {todayApps.map(a => (
                <div key={a.id} style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{ minWidth: '48px', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary)' }}>
                      {new Date(a.dateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div style={{ flex: 1, padding: '0.6rem 0.75rem', borderRadius: '0.5rem', background: a.status === 'IN_PROGRESS' ? '#fffbeb' : '#f8fafc', borderLeft: `3px solid ${getTypeColor(a.type)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>{a.patientName}</p>
                      <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{a.type} · {a.reason}</p>
                    </div>
                    <AppointmentDetailModal appointment={a} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Quirófano */}
        <section className="glass-card" style={{ background: 'var(--primary)', color: 'white', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Siguiente Quirófano</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <MapPin size={16} />
            <p style={{ fontSize: '0.9rem' }}>Quirófano 1 — Disponible</p>
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '1rem' }}>
            {upcoming.find(a => a.type === 'Cirugía')
              ? `Próx. cirugía: ${upcoming.find(a => a.type === 'Cirugía')?.patientName}`
              : 'Sin cirugías programadas'}
          </div>
        </section>

        {/* Recent history */}
        <section className="glass-card" style={{ background: 'white', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Historial Reciente</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recent.slice(0, 5).map(a => {
              const st = getStatusStyle(a.status);
              return (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                  <div>
                    <p style={{ fontWeight: '600' }}>{a.patientName}</p>
                    <p style={{ color: '#94a3b8' }}>{a.reason}</p>
                  </div>
                  <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '2rem', background: st.bg, color: st.color, fontWeight: '600', whiteSpace: 'nowrap' }}>{st.label}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
