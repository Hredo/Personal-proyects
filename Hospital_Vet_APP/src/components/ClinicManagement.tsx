'use client';

import { useState } from 'react';
import Modal from './Modal';

interface ClinicManagementProps {
  clinics: any[];
  onClinicCreated?: () => void;
}

export default function ClinicManagement({ clinics, onClinicCreated }: ClinicManagementProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'ES',
    licenseNumber: '',
    veterinarian: '',
    plan: 'STARTER',
  });

  const handleCreateClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/clinics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create clinic');

      setShowCreateModal(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: 'ES',
        licenseNumber: '',
        veterinarian: '',
        plan: 'STARTER',
      });

      onClinicCreated?.();
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Creation failed'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>🏥 Gestos de Clínicas</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
          }}
        >
          ➕ Nueva Clínica
        </button>
      </div>

      {clinics.length === 0 ? (
        <p style={{ color: '#999' }}>No hay clínicas registradas</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Nombre</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Plan</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Estado</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clinics.map((clinic, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{clinic.name}</td>
                  <td style={{ padding: '0.75rem' }}>{clinic.email}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      background: clinic.plan === 'ENTERPRISE' ? '#3b82f6' : clinic.plan === 'PROFESSIONAL' ? '#8b5cf6' : '#6c757d',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                    }}>
                      {clinic.plan}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      background: clinic.status === 'ACTIVE' ? '#10b981' : clinic.status === 'TRIAL' ? '#f59e0b' : '#ef4444',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                    }}>
                      {clinic.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <button style={{
                      padding: '0.5rem 1rem',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                    }}>
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)}>
          <div style={{ padding: '2rem', maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Crear Nueva Clínica</h3>

            <form onSubmit={handleCreateClinic} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="text"
                placeholder="Nombre de la Clínica"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '0.5rem' }}
              />

              <input
                type="email"
                placeholder="Email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '0.5rem' }}
              />

              <input
                type="tel"
                placeholder="Teléfono"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '0.5rem' }}
              />

              <input
                type="text"
                placeholder="Dirección"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '0.5rem' }}
              />

              <input
                type="text"
                placeholder="Ciudad"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '0.5rem' }}
              />

              <select
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '0.5rem' }}
              >
                <option value="STARTER">🌱 Starter</option>
                <option value="PROFESSIONAL">⭐ Professional</option>
                <option value="ENTERPRISE">🏢 Enterprise</option>
              </select>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: '#f5f5f5',
                    color: '#333',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: loading ? '#ccc' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                  }}
                >
                  {loading ? 'Creando...' : 'Crear Clínica'}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
