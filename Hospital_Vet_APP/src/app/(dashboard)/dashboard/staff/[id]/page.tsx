import db from '@/lib/db';
import { notFound } from 'next/navigation';
import { 
  Users, 
  Clock, 
  Calendar as CalendarIcon, 
  Award, 
  BookOpen, 
  Briefcase, 
  CheckCircle2, 
  XCircle,
  ArrowLeft,
  Mail,
  Shield,
  Stethoscope,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const staff: any = db.prepare(`
    SELECT e.*, u.name as userName, u.email as userEmail, u.role as userRole, u.createdAt as userCreatedAt
    FROM employees e
    JOIN users u ON e.userId = u.id
    WHERE e.userId = ?
  `).get(id);

  if (!staff) return notFound();

  const attendance: any[] = db.prepare(`
    SELECT * FROM employee_attendance 
    WHERE userId = ? 
    ORDER BY timestamp DESC 
    LIMIT 30
  `).all(id);

  // Group attendance by day
  const attendanceByDay = attendance.reduce((acc: any, curr: any) => {
    const day = curr.timestamp.split(' ')[0];
    if (!acc[day]) acc[day] = [];
    acc[day].push(curr);
    return acc;
  }, {});

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrador',
    VETERINARIAN: 'Veterinario',
    STAFF: 'Auxiliar / Staff',
  };

  const roleColors: Record<string, string> = {
    ADMIN: '#5b21b6',
    VETERINARIAN: '#1e40af',
    STAFF: '#166534',
  };

  const initials = staff.userName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <Link href="/dashboard/staff" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>
        <ArrowLeft size={16} /> Volver al listado
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Profile Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ background: 'white', padding: '2rem', textAlign: 'center' }}>
            <div style={{
              width: '100px', height: '100px', borderRadius: '32px', margin: '0 auto 1.5rem',
              background: `linear-gradient(135deg, ${roleColors[staff.userRole]}22, ${roleColors[staff.userRole]}44)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', fontWeight: '800', color: roleColors[staff.userRole]
            }}>
              {initials}
            </div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{staff.userName}</h1>
            <div style={{ 
              display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '2rem', 
              background: `${roleColors[staff.userRole]}11`, color: roleColors[staff.userRole],
              fontSize: '0.8rem', fontWeight: '700', marginBottom: '1.5rem'
            }}>
              {roleLabels[staff.userRole]}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#64748b', fontSize: '0.9rem' }}>
                <Mail size={16} /> {staff.userEmail}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#64748b', fontSize: '0.9rem' }}>
                <Shield size={16} /> Licencia: {staff.licenseNumber || 'N/A'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#64748b', fontSize: '0.9rem' }}>
                <Clock size={16} /> {staff.schedule || 'Sin horario definido'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#64748b', fontSize: '0.9rem' }}>
                <CalendarIcon size={16} /> Alta: {new Date(staff.userCreatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ background: 'white', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Award size={18} color="var(--primary)" /> Especialización
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: '1.5' }}>
              {staff.specialization || 'Medicina General Veterinaria'}
            </p>
          </div>
        </div>

        {/* Main Content Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Qualifications & Bio */}
          <div className="glass-card" style={{ background: 'white', padding: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                  <BookOpen size={20} color="var(--primary)" /> Títulos y Formación
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {staff.qualifications ? staff.qualifications.split('\n').map((line: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: '0.75rem' }}>
                       <div style={{ marginTop: '0.3rem', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
                       <p style={{ fontSize: '0.9rem', color: '#475569' }}>{line}</p>
                    </div>
                  )) : (
                    <p style={{ fontSize: '0.9rem', color: '#94a3b8', fontStyle: 'italic' }}>No se han detallado títulos adjuntos.</p>
                  )}
                </div>
              </div>
              <div>
                <h2 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                  <Briefcase size={20} color="var(--primary)" /> Biografía / Perfil
                </h2>
                <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.6' }}>
                  {staff.biography || `${staff.userName} forma parte de nuestro equipo ${roleLabels[staff.userRole].toLowerCase()} aportando su experiencia en el cuidado animal.`}
                </p>
              </div>
            </div>
          </div>

          {/* Attendance Log */}
          <div className="glass-card" style={{ background: 'white', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
              <Clock size={20} color="var(--primary)" /> Registro de Fichajes y Horarios
            </h2>

            {Object.keys(attendanceByDay).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                <Clock size={40} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                <p>No hay registros de asistencia para este empleado todavía.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Object.entries(attendanceByDay).map(([day, logs]: [string, any]) => (
                  <div key={day} style={{ 
                    border: '1px solid #f1f5f9', borderRadius: '0.75rem', overflow: 'hidden'
                  }}>
                    <div style={{ 
                      background: '#f8fafc', padding: '0.75rem 1.25rem', borderBottom: '1px solid #f1f5f9',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <p style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1e293b' }}>
                        {new Date(day).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                    </div>
                    <div style={{ padding: '1rem 1.25rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                      {logs.map((log: any) => (
                        <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: log.type === 'IN' ? '#dcfce7' : '#fee2e2',
                            color: log.type === 'IN' ? '#166534' : '#991b1b',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {log.type === 'IN' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                          </div>
                          <div>
                            <p style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>
                              {log.type === 'IN' ? 'Entrada' : 'Salida'}
                            </p>
                            <p style={{ fontSize: '1rem', fontWeight: '600', color: '#334155' }}>
                              {new Date(log.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
