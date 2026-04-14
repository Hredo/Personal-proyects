import db from '@/lib/db';
import { Activity, Clock, Users, Shield, Plus, AlertCircle, CheckCircle, RefreshCcw } from 'lucide-react';
import { OccupyORButton, ReleaseORButton, CleanORButton, ORHistoryModal } from '@/components/ORActions';

export default async function OperatingRoomsPage() {
  const rooms: any[] = db.prepare(`
    SELECT 
      r.*, 
      p.name as patientName, 
      p.species as patientSpecies,
      u.name as ownerName
    FROM operating_rooms r
    LEFT JOIN patients p ON r.patientId = p.id
    LEFT JOIN clients c ON p.ownerId = c.id
    LEFT JOIN users u ON c.userId = u.id
    ORDER BY r.name ASC
  `).all();

  const allPatients: any[] = db.prepare(`
    SELECT p.id, p.name, p.species, u.name as ownerName
    FROM patients p
    JOIN clients c ON p.ownerId = c.id
    JOIN users u ON c.userId = u.id
    ORDER BY p.name ASC
  `).all();

  const allStaff: any[] = db.prepare(`
    SELECT e.id, u.name as userName, e.specialization
    FROM employees e
    JOIN users u ON e.userId = u.id
    ORDER BY u.name ASC
  `).all();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return { bg: '#dcfce7', text: '#166534', label: 'Disponible' };
      case 'OCCUPIED':  return { bg: '#fee2e2', text: '#991b1b', label: 'En Cirugía' };
      case 'CLEANING':  return { bg: '#fef9c3', text: '#854d0e', label: 'En Limpieza' };
      default:          return { bg: '#f1f5f9', text: '#64748b', label: status };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem' }}>Gestión de Quirófanos</h1>
          <p style={{ color: '#64748b' }}>Monitorización en tiempo real de intervenciones quirúrgicas.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem 1.25rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#166534' }}></div>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>{rooms.filter(r => r.status === 'AVAILABLE').length} Libres</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#991b1b' }}></div>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>{rooms.filter(r => r.status === 'OCCUPIED').length} Ocupados</span>
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {rooms.map(room => {
          const status = getStatusColor(room.status);
          const staffIds = room.staffIds ? JSON.parse(room.staffIds) : [];
          const matchedStaff = allStaff.filter(s => staffIds.includes(s.id));

          return (
            <div key={room.id} className="glass-card" style={{ 
              background: 'white', 
              padding: '1.5rem', 
              borderTop: `4px solid ${status.text}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{room.name}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: '700', 
                      textTransform: 'uppercase', 
                      padding: '0.25rem 0.6rem', 
                      borderRadius: '2rem',
                      background: status.bg,
                      color: status.text
                    }}>
                      {status.label}
                    </span>
                    <ORHistoryModal orName={room.name} findings={room.findings} />
                  </div>
                </div>
                {room.status === 'AVAILABLE' && (
                  <OccupyORButton orId={room.id} orName={room.name} patients={allPatients} staff={allStaff} />
                )}
                {room.status === 'OCCUPIED' && (
                  <ReleaseORButton orId={room.id} orName={room.name} />
                )}
                {room.status === 'CLEANING' && (
                  <CleanORButton orId={room.id} />
                )}
              </div>

              {room.status === 'OCCUPIED' ? (
                <div style={{ background: '#f8fafc', borderRadius: '0.75rem', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Activity size={24} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paciente Actual</p>
                      <p style={{ fontWeight: '700' }}>{room.patientName} <span style={{ fontWeight: '400', color: '#64748b' }}>({room.patientSpecies})</span></p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.2rem' }}>Procedimiento</p>
                      <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>{room.procedure}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.2rem' }}>Inicio</p>
                      <p style={{ fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={14} /> {new Date(room.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Equipo Asignado</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {matchedStaff.map(s => (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'white', padding: '0.2rem 0.5rem', borderRadius: '0.4rem', border: '1px solid #e2e8f0', fontSize: '0.75rem' }}>
                          <Users size={12} color="#64748b" /> {s.userName}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : room.status === 'CLEANING' ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', background: '#fffbeb', borderRadius: '0.75rem', color: '#854d0e' }}>
                  <RefreshCcw size={32} className="animate-spin" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>Quirófano en proceso de desinfección</p>
                  <p style={{ fontSize: '0.75rem' }}>Estará disponible en unos minutos.</p>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', border: '2px dashed #e2e8f0', borderRadius: '0.75rem' }}>
                  <Shield size={32} style={{ margin: '0 auto 1rem', color: '#cbd5e1' }} />
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Quirófano listo para recibir pacientes.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
