import db from '@/lib/db';
import { Users, Stethoscope, Clock, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import { NewEmployeeButton, DeleteEmployeeButton } from '@/components/StaffActions';

export default async function StaffPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role } = await searchParams;

  let staffMembers: any[] = db.prepare(`
    SELECT e.*, u.name as userName, u.email as userEmail, u.role as userRole
    FROM employees e
    JOIN users u ON e.userId = u.id
    ORDER BY u.name ASC
  `).all();

  if (role && role !== 'ALL') {
    staffMembers = staffMembers.filter(s => s.userRole === role);
  }

  const allStaff: any[] = db.prepare(`
    SELECT e.*, u.name as userName, u.email as userEmail, u.role as userRole
    FROM employees e JOIN users u ON e.userId = u.id
  `).all();

  const vetCount   = allStaff.filter(s => s.userRole === 'VETERINARIAN').length;
  const staffCount = allStaff.filter(s => s.userRole === 'STAFF').length;
  const adminCount = allStaff.filter(s => s.userRole === 'ADMIN').length;

  const roleColors: Record<string, { bg: string; color: string; label: string }> = {
    ADMIN:        { bg: '#ede9fe', color: '#5b21b6', label: 'Administrador' },
    VETERINARIAN: { bg: '#dbeafe', color: '#1e40af', label: 'Veterinario' },
    STAFF:        { bg: '#dcfce7', color: '#166534', label: 'Auxiliar' },
  };

  const scheduleColors: Record<string, string> = {
    'Mañana':  '#f0fdf9',
    'Tarde':   '#fef9c3',
    'Noche':   '#f1f0ff',
    'Rotativo': '#f8fafc',
  };

  const filterTabs = [
    { value: '', label: `Todo el Personal (${allStaff.length})` },
    { value: 'VETERINARIAN', label: `Veterinarios (${vetCount})` },
    { value: 'ADMIN', label: `Administración (${adminCount})` },
    { value: 'STAFF', label: `Auxiliares (${staffCount})` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem' }}>Gestión de Personal</h1>
          <p style={{ color: '#64748b' }}>{allStaff.length} empleados activos en el sistema.</p>
        </div>
        <NewEmployeeButton />
      </header>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        {[
          { label: 'Total Empleados', value: allStaff.length, color: 'var(--primary)', icon: <Users size={20} /> },
          { label: 'Veterinarios', value: vetCount, color: '#1e40af', icon: <Stethoscope size={20} /> },
          { label: 'Auxiliares', value: staffCount, color: '#166534', icon: <Users size={20} /> },
          { label: 'Administración', value: adminCount, color: '#5b21b6', icon: <Users size={20} /> },
        ].map((kpi, i) => (
          <div key={i} className="glass-card" style={{ padding: '1.25rem', background: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: kpi.color }}>
              {kpi.icon}
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{kpi.label}</p>
            </div>
            <h3 style={{ fontSize: '1.8rem', color: kpi.color }}>{kpi.value}</h3>
          </div>
        ))}
      </div>

      {/* Role filter */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {filterTabs.map(ft => (
          <a key={ft.value} href={ft.value ? `/dashboard/staff?role=${ft.value}` : '/dashboard/staff'}
            className="btn"
            style={{
              background: (role === ft.value || (!role && !ft.value)) ? 'var(--primary)' : 'white',
              color: (role === ft.value || (!role && !ft.value)) ? 'white' : '#374151',
              border: '1px solid var(--border)', textDecoration: 'none', padding: '0.4rem 1rem', fontSize: '0.85rem'
            }}>
            {ft.label}
          </a>
        ))}
      </div>

      {/* Staff cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {staffMembers.map(staff => {
          const rc = roleColors[staff.userRole] || { bg: '#f1f5f9', color: '#374151', label: staff.userRole };
          const scheduleShift = staff.schedule?.includes('Mañana') ? 'Mañana'
            : staff.schedule?.includes('Tarde') ? 'Tarde'
            : staff.schedule?.includes('Noche') ? 'Noche'
            : 'Rotativo';
          const initials = staff.userName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

          return (
            <div key={staff.id} className="glass-card" style={{ background: 'white', padding: '1.5rem', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                <DeleteEmployeeButton userId={staff.userId} name={staff.userName} />
              </div>

              {/* Header */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '16px', flexShrink: 0,
                  background: `linear-gradient(135deg, ${rc.color}22, ${rc.color}44)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem', fontWeight: '700', color: rc.color
                }}>
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.2rem' }}>{staff.userName}</h3>
                  <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '2rem', background: rc.bg, color: rc.color, fontWeight: '600' }}>
                    {rc.label}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem', color: '#64748b' }}>
                  <Mail size={14} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{staff.userEmail}</span>
                </div>
                {staff.specialization && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem', color: '#64748b' }}>
                    <Stethoscope size={14} />
                    <span>{staff.specialization}</span>
                  </div>
                )}
                {staff.licenseNumber && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
                    <span>Licencia: <strong>{staff.licenseNumber}</strong></span>
                  </div>
                )}
                {staff.schedule && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem', color: '#64748b' }}>
                    <Clock size={14} />
                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '0.25rem', background: scheduleColors[scheduleShift] || '#f8fafc', fontWeight: '500', fontSize: '0.8rem' }}>
                      {staff.schedule}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 'auto' }}>
                <Link href={`/dashboard/staff/${staff.userId}`} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--primary)', fontWeight: '600', fontSize: '0.85rem',
                  textDecoration: 'none', padding: '0.5rem', background: '#f0fdf9',
                  borderRadius: '0.5rem', border: '1px solid #ccfbf1', width: '100%'
                }}>
                  Ver Expediente y Horarios →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
