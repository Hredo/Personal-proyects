'use client';

import { useState, useEffect, useActionState } from 'react';
import { toggleAttendance, getAttendanceStatus } from '@/lib/actions';
import { Clock, LogIn, LogOut, Loader2 } from 'lucide-react';

export function AttendanceControl({ userId }: { userId: string }) {
  const [status, setStatus] = useState<{ type: string, timestamp: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      const last = await getAttendanceStatus(userId);
      setStatus(last || null);
      setIsLoading(false);
    }
    checkStatus();
  }, [userId]);

  const handleToggle = async () => {
    setIsLoading(true);
    const result = await toggleAttendance(userId);
    if (result.success) {
      const last = await getAttendanceStatus(userId);
      setStatus(last || null);
    }
    setIsLoading(false);
  };

  const isIn = status?.type === 'IN';
  const lastTime = status ? new Date(status.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <div style={{
      background: 'white',
      padding: '0.75rem 1rem',
      borderRadius: '0.75rem',
      border: '1.5px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <p style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
          {isIn ? 'En Turno' : 'Fuera de Turno'}
        </p>
        <p style={{ fontSize: '0.8rem', fontWeight: '600', color: '#1e293b' }}>
          {lastTime ? `Desde las ${lastTime}` : 'Sin registros hoy'}
        </p>
      </div>

      <button 
        onClick={handleToggle}
        disabled={isLoading}
        style={{
          background: isIn ? '#fee2e2' : '#dcfce7',
          color: isIn ? '#991b1b' : '#166534',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.85rem',
          fontWeight: '700',
          transition: 'all 0.2s',
          minWidth: '120px',
          justifyContent: 'center'
        }}
      >
        {isLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : isIn ? (
          <>
            <LogOut size={16} /> Salir
          </>
        ) : (
          <>
            <LogIn size={16} /> Fichar
          </>
        )}
      </button>
    </div>
  );
}
