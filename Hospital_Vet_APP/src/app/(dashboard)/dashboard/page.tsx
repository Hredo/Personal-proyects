import Link from 'next/link';
import { Activity, Clock, Users, ArrowUpRight, Plus, ExternalLink, AlertTriangle } from 'lucide-react';
import db from '@/lib/db';

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'CRITICAL':     return 'status-critical';
    case 'HOSPITALIZED': return 'status-hospitalized';
    case 'STABLE':       return 'status-stable';
    case 'TREATMENT':    return 'status-observation';
    default:             return '';
  }
};

const statusLabels: Record<string, string> = {
  HOSPITALIZED: 'Hospitalizado', CRITICAL: 'Crítico', TREATMENT: 'En Tratamiento'
};

export default async function DashboardPage() {
  const hospitalizedCount  = (db.prepare(`SELECT COUNT(*) c FROM hospitalizations WHERE dischargeDate IS NULL`).get() as any).c;
  const criticalCount      = (db.prepare(`SELECT COUNT(*) c FROM patients WHERE status='CRITICAL'`).get() as any).c;
  const totalPatients      = (db.prepare(`SELECT COUNT(*) c FROM patients`).get() as any).c;
  const staffCount         = (db.prepare(`SELECT COUNT(*) c FROM employees`).get() as any).c;
  const todayStr           = new Date().toISOString().split('T')[0];
  const todayAppts         = (db.prepare(`SELECT COUNT(*) c FROM appointments WHERE dateTime LIKE ? AND status='SCHEDULED'`).get(`${todayStr}%`) as any).c;
  const pendingInvoices    = (db.prepare(`SELECT COUNT(*) c FROM invoices WHERE status='PENDING'`).get() as any).c;

  const hospitalizedPatients: any[] = db.prepare(`
    SELECT p.*, u.name as ownerName, h.status as hospStatus, h.admissionDate
    FROM patients p
    JOIN clients c ON p.ownerId = c.id
    JOIN users u ON c.userId = u.id
    JOIN hospitalizations h ON p.id = h.patientId
    WHERE h.dischargeDate IS NULL
    ORDER BY h.admissionDate ASC
    LIMIT 6
  `).all();

  const activeVets: any[] = db.prepare(`
    SELECT u.name, e.specialization, u.role
    FROM employees e
    JOIN users u ON e.userId = u.id
    WHERE u.role = 'VETERINARIAN'
    ORDER BY u.name
    LIMIT 5
  `).all();

  const upcomingAppts: any[] = db.prepare(`
    SELECT a.*, p.name as patientName
    FROM appointments a
    JOIN patients p ON a.patientId = p.id
    WHERE a.status = 'SCHEDULED' AND a.dateTime >= CURRENT_TIMESTAMP
    ORDER BY a.dateTime ASC
    LIMIT 5
  `).all();

  const lowStockCount = (db.prepare(`SELECT COUNT(*) c FROM inventory_items WHERE quantity <= minStock`).get() as any).c;

  const stats = [
    { label: 'Hospitalizados Activos', value: hospitalizedCount, color: '#0f766e', trend: criticalCount > 0 ? `⚠ ${criticalCount} crítico${criticalCount !== 1 ? 's' : ''}` : 'Sin críticos', href: '/dashboard/hospital/monitor' },
    { label: 'Total Pacientes', value: totalPatients, color: '#6366f1', trend: 'Registros activos', href: '/dashboard/patients' },
    { label: 'Citas Hoy', value: todayAppts, color: '#0ea5e9', trend: 'Pendientes de atención', href: '/dashboard/appointments' },
    { label: 'Personal Activo', value: staffCount, color: '#f59e0b', trend: 'Empleados en sistema', href: '/dashboard/staff' },
    { label: 'Facturas Pendientes', value: pendingInvoices, color: '#8b5cf6', trend: 'Sin cobrar', href: '/dashboard/billing' },
    { label: 'Stock Bajo', value: lowStockCount, color: '#ef4444', trend: 'Artículos a reponer', href: '/dashboard/inventory' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem' }}>Resumen del Hospital</h1>
          <p style={{ color: '#64748b' }}>
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/dashboard/hospital/monitor" className="btn" style={{ border: '1px solid var(--border)', background: 'white', textDecoration: 'none' }}>
            <Activity size={18} style={{ marginRight: '0.5rem' }} />
            Monitor General
          </Link>
          <Link href="/dashboard/patients" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            <Plus size={18} style={{ marginRight: '0.5rem' }} />
            Nuevo Paciente
          </Link>
        </div>
      </header>

      {/* Alerts */}
      {(criticalCount > 0 || lowStockCount > 0) && (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {criticalCount > 0 && (
            <Link href="/dashboard/hospital/monitor" style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.25rem',
              background: '#fef2f2', borderRadius: '0.5rem', border: '1px solid #fecaca',
              textDecoration: 'none', color: '#991b1b', fontWeight: '600', fontSize: '0.9rem'
            }}>
              <AlertTriangle size={18} />
              {criticalCount} paciente{criticalCount !== 1 ? 's' : ''} en estado crítico — Atención inmediata
            </Link>
          )}
          {lowStockCount > 0 && (
            <Link href="/dashboard/inventory" style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.25rem',
              background: '#fffbeb', borderRadius: '0.5rem', border: '1px solid #fde68a',
              textDecoration: 'none', color: '#92400e', fontWeight: '600', fontSize: '0.9rem'
            }}>
              <AlertTriangle size={18} />
              {lowStockCount} artículo{lowStockCount !== 1 ? 's' : ''} con stock bajo
            </Link>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="glass-card" style={{
            padding: '1.5rem', background: 'white', textDecoration: 'none', color: 'inherit',
            transition: 'transform 0.2s, box-shadow 0.2s', display: 'block'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: `${stat.color}18`, color: stat.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Activity size={24} />
              </div>
              <ArrowUpRight size={18} color="#94a3b8" />
            </div>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.25rem' }}>{stat.label}</p>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '0.5rem', color: stat.color }}>{stat.value}</h2>
            <p style={{ fontSize: '0.75rem', fontWeight: '600', color: stat.color }}>{stat.trend}</p>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Hospitalized patients */}
        <section className="glass-card" style={{ background: 'white', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Pacientes Hospitalizados</h2>
            <Link href="/dashboard/hospital/monitor" style={{ color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}>
              Ver todos <ExternalLink size={14} />
            </Link>
          </div>

          {hospitalizedPatients.length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>No hay pacientes hospitalizados.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                  {['PACIENTE', 'PROPIETARIO', 'ESTADO', 'INGRESO', ''].map(h => (
                    <th key={h} style={{ padding: '0.75rem 0.5rem', color: '#64748b', fontWeight: '500', fontSize: '0.8rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hospitalizedPatients.map((patient) => {
                  const days = Math.floor((Date.now() - new Date(patient.admissionDate).getTime()) / 86400000);
                  return (
                    <tr key={patient.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{patient.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{patient.species}</div>
                      </td>
                      <td style={{ padding: '1rem 0.5rem', fontSize: '0.85rem' }}>{patient.ownerName}</td>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        <span className={`badge ${getStatusBadgeClass(patient.status)}`} style={{ fontSize: '0.72rem' }}>
                          {statusLabels[patient.status] || patient.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                        {days === 0 ? 'Hoy' : `${days} día${days !== 1 ? 's' : ''}`}
                      </td>
                      <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                        <Link href={`/dashboard/hospital/monitor?id=${patient.id}`} style={{
                          color: 'white', background: 'var(--primary)', padding: '0.35rem 0.75rem',
                          borderRadius: '0.35rem', fontSize: '0.78rem', textDecoration: 'none', fontWeight: '600'
                        }}>Monitor</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Upcoming appointments */}
          <section className="glass-card" style={{ background: 'linear-gradient(135deg, #0f766e, #134e4a)', color: 'white', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', marginBottom: '1rem', opacity: 0.9 }}>Próximas Citas</h2>
            {upcomingAppts.length === 0 ? (
              <p style={{ opacity: 0.6, fontSize: '0.85rem' }}>Sin citas pendientes.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {upcomingAppts.map(a => (
                  <div key={a.id} style={{ display: 'flex', gap: '0.75rem', padding: '0.6rem', background: 'rgba(255,255,255,0.1)', borderRadius: '0.5rem' }}>
                    <div style={{ minWidth: '36px', textAlign: 'center' }}>
                      <p style={{ fontSize: '0.6rem', opacity: 0.7 }}>{new Date(a.dateTime).toLocaleDateString('es-ES', { month: 'short' })}</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: '800', lineHeight: '1' }}>{new Date(a.dateTime).getDate()}</p>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>{a.patientName}</p>
                      <p style={{ fontSize: '0.72rem', opacity: 0.7 }}>{a.type} · {new Date(a.dateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))}
                <Link href="/dashboard/appointments" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', textDecoration: 'none', textAlign: 'center', marginTop: '0.25rem' }}>
                  Ver todas las citas →
                </Link>
              </div>
            )}
          </section>

          {/* Veterinarians on duty */}
          <section className="glass-card" style={{ background: 'white', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={16} color="var(--primary)" /> Veterinarios en Turno
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {activeVets.map((vet, i) => {
                const initials = vet.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                const colors = ['#0f766e', '#6366f1', '#0ea5e9', '#f59e0b', '#ef4444'];
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                      background: `${colors[i % colors.length]}22`, color: colors[i % colors.length],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.8rem', fontWeight: '800'
                    }}>{initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vet.name}</p>
                      <p style={{ fontSize: '0.72rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vet.specialization || 'Medicina General'}</p>
                    </div>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
                  </div>
                );
              })}
            </div>
            <Link href="/dashboard/staff" style={{ color: 'var(--primary)', fontSize: '0.8rem', textDecoration: 'none', display: 'block', marginTop: '1rem', textAlign: 'center' }}>
              Ver todo el personal →
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
