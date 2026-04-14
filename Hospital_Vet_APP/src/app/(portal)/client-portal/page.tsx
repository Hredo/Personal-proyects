import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import { PawPrint, Heart, Calendar, FileText, Phone, Mail, AlertCircle, CheckCircle, Bell } from 'lucide-react';
import { RequestAppointmentButton, PetHistoryPanel } from '@/components/PortalActions';
import { PaymentModal } from '@/components/PaymentModal';
import { AddPetButton } from '@/components/AddPetPortal';
import { EditProfileButton, EditPetButton } from '@/components/ProfileActions';

export default async function ClientPortalPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user: any = db.prepare(`SELECT * FROM users WHERE id = ?`).get(session.user.id);
  const client: any = db.prepare(`SELECT * FROM clients WHERE userId = ?`).get(session.user.id);

  if (!client) {
    return (
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', background: 'white' }}>
        <AlertCircle size={48} style={{ margin: '0 auto 1rem', color: '#94a3b8' }} />
        <h2>Perfil de cliente no encontrado</h2>
        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
          Tu cuenta no está vinculada a un cliente. Contacta con la clínica para más información.
        </p>
      </div>
    );
  }

  const pets: any[] = db.prepare(`
    SELECT * FROM patients WHERE ownerId = ? ORDER BY name
  `).all(client.id);

  // For each pet, get medical records and appointments
  const petsWithData = pets.map(pet => {
    const records: any[] = db.prepare(`
      SELECT mr.*, u.name as vetName
      FROM medical_records mr
      JOIN employees e ON mr.veterinarianId = e.id
      JOIN users u ON e.userId = u.id
      WHERE mr.patientId = ?
      ORDER BY mr.date DESC
    `).all(pet.id);

    const appointments: any[] = db.prepare(`
      SELECT * FROM appointments WHERE patientId = ? ORDER BY dateTime DESC
    `).all(pet.id);

    return { ...pet, records, appointments };
  });

  // All upcoming appointments for this client's pets
  const allPetIds = pets.map(p => `'${p.id}'`).join(',');
  const upcomingAppointments = allPetIds.length > 0 ? db.prepare(`
    SELECT a.*, p.name as petName
    FROM appointments a
    JOIN patients p ON a.patientId = p.id
    WHERE a.patientId IN (${allPetIds})
      AND a.status = 'SCHEDULED'
      AND a.dateTime >= CURRENT_TIMESTAMP
    ORDER BY a.dateTime ASC
    LIMIT 5
  `).all() : [];

  // All invoices for this client
  const invoices: any[] = db.prepare(`
    SELECT * FROM invoices WHERE clientId = ? ORDER BY createdAt DESC LIMIT 5
  `).all(client.id);

  const invoiceItems: any[] = db.prepare(`
    SELECT ii.*
    FROM invoice_items ii
    JOIN invoices i ON ii.invoiceId = i.id
    WHERE i.clientId = ?
    ORDER BY ii.createdAt DESC
  `).all(client.id);

  const itemsByInvoice = invoiceItems.reduce((acc, item) => {
    if (!acc[item.invoiceId]) acc[item.invoiceId] = [];
    acc[item.invoiceId].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const notifications: any[] = db.prepare(`
    SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 6
  `).all(session.user.id);

  const statusColor: Record<string, string> = {
    HEALTHY: '#166534', TREATMENT: '#854d0e', HOSPITALIZED: '#991b1b', CRITICAL: '#450a0a'
  };
  const statusBg: Record<string, string> = {
    HEALTHY: '#dcfce7', TREATMENT: '#fef9c3', HOSPITALIZED: '#fee2e2', CRITICAL: '#fecaca'
  };
  const statusLabel: Record<string, string> = {
    HEALTHY: 'Sano', TREATMENT: 'En Tratamiento', HOSPITALIZED: 'Hospitalizado', CRITICAL: 'Crítico'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Hero welcome */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, #0f766e, #134e4a)',
        color: 'white', padding: '2.5rem', borderRadius: '1.25rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <p style={{ opacity: 0.7, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Panel de Propietario</p>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>¡Hola, {user.name?.split(' ')[0]}! 👋</h1>
            <p style={{ opacity: 0.8, marginBottom: '1rem' }}>Bienvenido/a a tu portal de VetPortal. Aquí puedes gestionar todo sobre tus mascotas.</p>
            <EditProfileButton user={user} client={client} />
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.15)', borderRadius: '0.75rem' }}>
              <p style={{ fontSize: '2rem', fontWeight: '800' }}>{pets.length}</p>
              <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Mascotas</p>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.15)', borderRadius: '0.75rem' }}>
              <p style={{ fontSize: '2rem', fontWeight: '800' }}>{upcomingAppointments.length}</p>
              <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Citas</p>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.15)', borderRadius: '0.75rem' }}>
              <p style={{ fontSize: '2rem', fontWeight: '800' }}>{petsWithData.reduce((s, p) => s + p.records.length, 0)}</p>
              <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Registros</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* My Pets */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <PawPrint size={22} color="var(--primary)" /> Mis Mascotas
              </h2>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <AddPetButton clientId={client.id} />
                <RequestAppointmentButton pets={pets.map(p => ({ id: p.id, name: p.name, species: p.species }))} />
              </div>
            </div>

            {pets.length === 0 ? (
              <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', background: 'white' }}>
                <PawPrint size={40} style={{ margin: '0 auto 1rem', color: '#cbd5e1' }} />
                <p style={{ color: '#94a3b8' }}>No tienes mascotas registradas aún.</p>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.5rem' }}>Contacta con la clínica para añadir a tu mascota.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {petsWithData.map(pet => {
                  const lastRecord = pet.records[0];
                  const hosp: any = db.prepare(`SELECT * FROM hospitalizations WHERE patientId = ? AND dischargeDate IS NULL LIMIT 1`).get(pet.id);

                  return (
                    <div key={pet.id} className="glass-card" style={{ background: 'white', padding: '1.5rem' }}>
                      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                        <div style={{
                          width: '64px', height: '64px', borderRadius: '18px', flexShrink: 0,
                          background: 'linear-gradient(135deg, #f0fdf9, #ccfbf1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)'
                        }}>
                          <PawPrint size={32} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                <h3 style={{ fontSize: '1.15rem' }}>{pet.name}</h3>
                                <EditPetButton pet={pet} />
                              </div>
                              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                                {pet.species}{pet.breed ? ` · ${pet.breed}` : ''}{pet.gender ? ` · ${pet.gender}` : ''}{pet.weight ? ` · ${pet.weight}kg` : ''}
                              </p>
                            </div>
                            <span style={{
                              fontSize: '0.75rem', padding: '0.3rem 0.7rem', borderRadius: '2rem', fontWeight: '600',
                              background: statusBg[pet.status] || '#f1f5f9', color: statusColor[pet.status] || '#374151'
                            }}>
                              {statusLabel[pet.status] || pet.status}
                            </span>
                          </div>

                          {hosp && (
                            <div style={{ background: '#fee2e2', borderRadius: '0.5rem', padding: '0.6rem 0.8rem', marginBottom: '0.75rem', fontSize: '0.8rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <AlertCircle size={14} />
                              Actualmente hospitalizado/a. Puedes llamar para consultar su estado.
                            </div>
                          )}

                          {lastRecord && (
                            <div style={{ background: '#f8fafc', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem' }}>
                              <p style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Último diagnóstico</p>
                              <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>{lastRecord.diagnosis}</p>
                              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                {new Date(lastRecord.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                                {lastRecord.vetName ? ` · ${lastRecord.vetName}` : ''}
                              </p>
                              {lastRecord.treatment && (
                                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>Tto: {lastRecord.treatment}</p>
                              )}
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <PetHistoryPanel
                              pet={{ id: pet.id, name: pet.name, species: pet.species }}
                              records={pet.records}
                              appointments={pet.appointments}
                            />
                            <RequestAppointmentButton
                              pets={[{ id: pet.id, name: pet.name, species: pet.species }]}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '1rem' }}>
          {/* Notifications */}
          <div className="glass-card" style={{ background: 'white', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={16} color="var(--primary)" /> Notificaciones
            </h3>
            {notifications.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>No tienes notificaciones nuevas.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {notifications.map((n) => (
                  <div key={n.id} style={{ background: '#f8fafc', borderRadius: '0.5rem', padding: '0.7rem 0.75rem', borderLeft: '3px solid var(--primary)' }}>
                    <p style={{ fontSize: '0.82rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.2rem' }}>{n.title}</p>
                    <p style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '0.3rem' }}>{n.message}</p>
                    <p style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{new Date(n.createdAt).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming appointments */}
          <div className="glass-card" style={{ background: 'white', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} color="var(--primary)" /> Próximas Citas
            </h3>
            {upcomingAppointments.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem' }}>Sin citas programadas.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(upcomingAppointments as any[]).map((a: any) => (
                  <div key={a.id} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', borderLeft: '3px solid var(--primary)' }}>
                    <div style={{ textAlign: 'center', minWidth: '40px' }}>
                      <p style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{new Date(a.dateTime).toLocaleDateString('es-ES', { month: 'short' })}</p>
                      <p style={{ fontSize: '1.2rem', fontWeight: '800', lineHeight: '1' }}>{new Date(a.dateTime).getDate()}</p>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>{a.petName}</p>
                      <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{a.type} · {new Date(a.dateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                      <p style={{ fontSize: '0.73rem', color: '#94a3b8' }}>{a.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invoices */}
          <div className="glass-card" style={{ background: 'white', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={16} color="var(--primary)" /> Mis Facturas
            </h3>
            {invoices.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>Sin facturas.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {invoices.map(inv => {
                  const isPaid = inv.status === 'PAID';
                  const isOverdue = inv.status === 'OVERDUE';
                  const detail = itemsByInvoice[inv.id] || [];
                  return (
                    <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: '700', fontSize: '0.9rem' }}>{Number(inv.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
                        <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{new Date(inv.createdAt).toLocaleDateString('es-ES')}</p>
                        {inv.consultationNumber && (
                          <p style={{ fontSize: '0.72rem', color: '#0f766e', fontWeight: '700', marginTop: '0.15rem' }}>
                            Consulta: {inv.consultationNumber}
                          </p>
                        )}

                        <details style={{ marginTop: '0.45rem' }}>
                          <summary style={{ cursor: 'pointer', fontSize: '0.74rem', color: '#334155', fontWeight: '700' }}>
                            Ver extracto
                          </summary>
                          {detail.length === 0 ? (
                            <p style={{ marginTop: '0.45rem', fontSize: '0.72rem', color: '#94a3b8' }}>Sin líneas detalladas disponibles.</p>
                          ) : (
                            <div style={{ marginTop: '0.45rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                              {detail.map((line) => (
                                <div key={line.id} style={{ background: 'white', borderRadius: '0.4rem', padding: '0.35rem 0.45rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                                    <p style={{ fontSize: '0.72rem', fontWeight: '700', color: '#0f172a' }}>{line.description}</p>
                                    <p style={{ fontSize: '0.72rem', fontWeight: '700', color: '#0f172a' }}>{Number(line.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
                                  </div>
                                  <p style={{ fontSize: '0.68rem', color: '#64748b' }}>
                                    {Number(line.quantity)} {line.unit} x {Number(line.unitPrice).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                                  </p>
                                  {line.notes && <p style={{ fontSize: '0.68rem', color: '#64748b' }}>Notas: {line.notes}</p>}
                                  <p style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{new Date(line.createdAt).toLocaleString('es-ES')}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </details>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {!isPaid && <PaymentModal invoiceId={inv.id} amount={Number(inv.amount)} />}
                        <span style={{
                          fontSize: '0.72rem', padding: '0.25rem 0.6rem', borderRadius: '2rem', fontWeight: '600',
                          background: isPaid ? '#dcfce7' : isOverdue ? '#fee2e2' : '#ffedd5',
                          color: isPaid ? '#166534' : isOverdue ? '#991b1b' : '#9a3412',
                          whiteSpace: 'nowrap'
                        }}>
                          {isPaid ? <><CheckCircle size={12} style={{ verticalAlign: 'middle', marginRight: '2px' }} />Pagado</> : isOverdue ? 'Vencido' : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Clinic contact info */}
          <div className="glass-card" style={{ background: 'linear-gradient(135deg, #f0fdf9, #d1fae5)', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#065f46' }}>
              <Heart size={16} fill="currentColor" /> Contacto Clínica
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', color: '#047857' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={14} /> +34 900 000 111</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={14} /> info@hospitalvet.com</div>
              <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #a7f3d0' }}>
                <p style={{ fontWeight: '600' }}>Urgencias 24h:</p>
                <p>+34 900 000 999</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
