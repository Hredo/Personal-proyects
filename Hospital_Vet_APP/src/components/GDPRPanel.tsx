'use client';

import { useState } from 'react';
import Modal from './Modal';

interface GDPRPanelProps {
  userId: string;
  userName: string;
}

export default function GDPRPanel({ userId, userName }: GDPRPanelProps) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleExportData = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/gdpr/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) throw new Error('Failed to export data');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gdpr-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();

      setMessage('✓ Datos exportados exitosamente');
      setShowExportModal(false);
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Exportación fallida'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDeletion = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/gdpr/request-deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) throw new Error('Failed to request deletion');

      const data = await response.json();
      setMessage(
        '✓ Solicitud de eliminación enviada. Por favor confirme en el enlace enviado a su email. ' +
        'Tiene 30 días para confirmar.'
      );
      setShowDeleteModal(false);
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Solicitud fallida'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1.5rem', marginTop: '2rem' }}>
      <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Derechos RGPD & Privacidad</h3>
      
      {message && (
        <div style={{
          background: '#d4edda',
          border: '1px solid #c3e6cb',
          color: '#155724',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
        }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{
          background: '#f8d7da',
          border: '1px solid #f5c6cb',
          color: '#721c24',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
        }}>
          {error}
        </div>
      )}

      <p style={{ color: '#666', marginBottom: '1.5rem' }}>
        Bajo el Reglamento General de Protección de Datos (RGPD), tiene derecho a:
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Right to Access */}
        <div style={{ background: '#f0f4f8', padding: '1rem', borderRadius: '0.5rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>📥 Derecho de Acceso</h4>
          <p style={{ fontSize: '0.9rem', color: '#666', margin: 0 }}>
            Obtener una copia de todos sus datos personales en formato legible
          </p>
        </div>

        {/* Right to Portability */}
        <div style={{ background: '#f0f4f8', padding: '1rem', borderRadius: '0.5rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>📦 Portabilidad de Datos</h4>
          <p style={{ fontSize: '0.9rem', color: '#666', margin: 0 }}>
            Recibir sus datos en un formato estructurado e interoperable
          </p>
        </div>

        {/* Right to Rectification */}
        <div style={{ background: '#f0f4f8', padding: '1rem', borderRadius: '0.5rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>✏️ Rectificación</h4>
          <p style={{ fontSize: '0.9rem', color: '#666', margin: 0 }}>
            Corregir datos personales inexactos o incompletos
          </p>
        </div>

        {/* Right to Erasure */}
        <div style={{ background: '#f0f4f8', padding: '1rem', borderRadius: '0.5rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>🗑️ Derecho al Olvido</h4>
          <p style={{ fontSize: '0.9rem', color: '#666', margin: 0 }}>
            Solicitar la eliminación de sus datos personales
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowExportModal(true)}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
          }}
        >
          💾 Exportar Mis Datos
        </button>

        <button
          onClick={() => setShowDeleteModal(true)}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#d32f2f',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
          }}
        >
          🗑️ Solicitar Eliminación
        </button>

        <a
          href="/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '0.75rem 1.5rem',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          📄 Política Completa
        </a>
      </div>

      {/* Export Data Modal */}
      {showExportModal && (
        <Modal onClose={() => setShowExportModal(false)}>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem' }}>Exportar Datos Personales</h3>
            <p style={{ marginBottom: '1.5rem', color: '#666' }}>
              Se descargará un archivo JSON con todos sus datos personales, incluyendo:
            </p>
            <ul style={{ textAlign: 'left', display: 'inline-block', marginBottom: '1.5rem' }}>
              <li>✓ Información de cuenta</li>
              <li>✓ Datos de perfil</li>
              <li>✓ Historial de mascotas</li>
              <li>✓ Registros médicos</li>
              <li>✓ Historiales de citas y pagos</li>
            </ul>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowExportModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#f5f5f5',
                  color: '#333',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleExportData}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: loading ? '#ccc' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                }}
              >
                {loading ? 'Procesando...' : '💾 Descargar Datos'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <Modal onClose={() => setShowDeleteModal(false)}>
          <div style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', color: '#d32f2f' }}>⚠️ Solicitar Eliminación Permanente</h3>
            <p style={{ marginBottom: '1rem', color: '#666' }}>
              Esta acción solicitará la eliminación permanente de su cuenta y todos sus datos personales.
            </p>
            <div style={{ 
              background: '#fff3cd', 
              border: '1px solid #ffc107', 
              padding: '1rem', 
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              color: '#856404',
            }}>
              <strong>⚠️ Importante:</strong> Se enviará un correo de confirmación. 
              Tiene 30 días para confirmar. Después de la confirmación, sus datos se eliminarán permanentemente.
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#f5f5f5',
                  color: '#333',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleRequestDeletion}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: loading ? '#ccc' : '#d32f2f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                }}
              >
                {loading ? 'Procesando...' : '🗑️ Solicitar Eliminación'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
