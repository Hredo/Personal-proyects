'use client';

import { useState } from 'react';

interface ConsentModalProps {
  onAccept: () => void;
  onReject?: () => void;
}

export default function ConsentModal({ onAccept, onReject }: ConsentModalProps) {
  const [acceptedAll, setAcceptedAll] = useState(false);
  const [consents, setConsents] = useState({
    privacy: false,
    terms: false,
    marketing: false,
    cookies: false,
  });

  const handleConsentChange = (key: keyof typeof consents) => {
    setConsents(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const allRequiredAccepted = consents.privacy && consents.terms;

  const handleAccept = () => {
    if (allRequiredAccepted) {
      setAcceptedAll(true);
      onAccept();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
    }}>
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Consentimiento de Privacidad y Términos</h2>
        
        <p style={{ marginBottom: '1.5rem', color: '#666' }}>
          Antes de continuar, debe aceptar nuestras políticas de privacidad y términos de servicio.
        </p>

        <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Privacy Policy Checkbox */}
          <label style={{ display: 'flex', gap: '0.75rem', cursor: 'pointer', alignItems: 'flex-start' }}>
            <input
              type="checkbox"
              checked={consents.privacy}
              onChange={() => handleConsentChange('privacy')}
              style={{ marginTop: '0.25rem', cursor: 'pointer' }}
              required
            />
            <span style={{ flex: 1 }}>
              Acepto la{' '}
              <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc', textDecoration: 'underline' }}>
                Política de Privacidad
              </a>
              {' '}y entiendo cómo se procesan mis datos personales.{' '}
              <span style={{ color: '#d32f2f' }}>*</span>
            </span>
          </label>

          {/* Terms of Service Checkbox */}
          <label style={{ display: 'flex', gap: '0.75rem', cursor: 'pointer', alignItems: 'flex-start' }}>
            <input
              type="checkbox"
              checked={consents.terms}
              onChange={() => handleConsentChange('terms')}
              style={{ marginTop: '0.25rem', cursor: 'pointer' }}
              required
            />
            <span style={{ flex: 1 }}>
              Acepto los{' '}
              <a href="/terms-of-service" target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc', textDecoration: 'underline' }}>
                Términos de Servicio
              </a>
              {' '}}y entiendo mis derechos y responsabilidades.{' '}
              <span style={{ color: '#d32f2f' }}>*</span>
            </span>
          </label>

          {/* Marketing Consent Checkbox */}
          <label style={{ display: 'flex', gap: '0.75rem', cursor: 'pointer', alignItems: 'flex-start' }}>
            <input
              type="checkbox"
              checked={consents.marketing}
              onChange={() => handleConsentChange('marketing')}
              style={{ marginTop: '0.25rem', cursor: 'pointer' }}
            />
            <span style={{ flex: 1 }}>
              Me gustaría recibir comunicaciones sobre actualizaciones de productos y ofertas especiales.{' '}
              <span style={{ color: '#999', fontSize: '0.9rem' }}>(Opcional)</span>
            </span>
          </label>

          {/* Cookies Consent Checkbox */}
          <label style={{ display: 'flex', gap: '0.75rem', cursor: 'pointer', alignItems: 'flex-start' }}>
            <input
              type="checkbox"
              checked={consents.cookies}
              onChange={() => handleConsentChange('cookies')}
              style={{ marginTop: '0.25rem', cursor: 'pointer' }}
            />
            <span style={{ flex: 1 }}>
              Acepto el uso de cookies técnicas para mejorar la experiencia del usuario.{' '}
              <span style={{ color: '#999', fontSize: '0.9rem' }}>(Opcional)</span>
            </span>
          </label>
        </div>

        <div style={{ 
          padding: '1rem', 
          background: '#f5f5f5', 
          borderRadius: '0.5rem', 
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
          color: '#666',
        }}>
          <p style={{ margin: 0 }}>
            <strong>Derechos RGPD:</strong> Puede retirar su consentimiento en cualquier momento accediendo a 
            la configuración de privacidad de su cuenta. Para conocer sus derechos completos, consulte nuestra{' '}
            <a href="/privacy-policy" style={{ color: '#0066cc' }}>Política de Privacidad</a>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={onReject}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: '#f5f5f5',
              color: '#333',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
            }}
          >
            Rechazar
          </button>
          <button
            onClick={handleAccept}
            disabled={!allRequiredAccepted}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: allRequiredAccepted ? '#10b981' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: allRequiredAccepted ? 'pointer' : 'not-allowed',
              fontSize: '1rem',
              fontWeight: '500',
            }}
          >
            {acceptedAll ? 'Aceptado ✓' : 'Aceptar Todo'}
          </button>
        </div>

        <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '1rem', margin: '1rem 0 0 0' }}>
          <span style={{ color: '#d32f2f' }}>*</span> Campos obligatorios
        </p>
      </div>
    </div>
  );
}
