'use client';

import { useActionState, useState, useEffect } from 'react';
import { addPetFromPortal } from '@/lib/actions';
import Modal from '@/components/Modal';
import { Plus, PawPrint } from 'lucide-react';
import { PET_SPECIES, PET_BREEDS } from '@/lib/pet-data';
import { SearchableSelect } from '@/components/SearchableSelect';

const inputS: React.CSSProperties = {
  width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem',
  border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '0.9rem', fontFamily: 'inherit'
};
const labelS: React.CSSProperties = { fontSize: '0.78rem', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '0.3rem' };
const fieldS: React.CSSProperties = { marginBottom: '1rem' };

export function AddPetButton({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState(addPetFromPortal, null);
  
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [selectedBreed, setSelectedBreed] = useState('');

  // Reset breed when species changes
  useEffect(() => {
    setSelectedBreed('');
  }, [selectedSpecies]);

  const breeds = selectedSpecies ? (PET_BREEDS[selectedSpecies] || ["Otro"]) : [];

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        background: 'white', color: '#0f766e', border: '1.5px solid #0f766e',
        padding: '0.55rem 1.1rem', borderRadius: '0.5rem', cursor: 'pointer',
        fontSize: '0.9rem', fontFamily: 'inherit', fontWeight: '700'
      }}>
        <Plus size={16} /> Añadir Mascota
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Registrar Nueva Mascota">
        {state?.success && (
          <div style={{ background: '#dcfce7', color: '#166534', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <PawPrint size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ fontWeight: '700' }}>¡Mascota registrada! 🐾</p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>{state.success}</p>
            </div>
          </div>
        )}
        {state?.error && <p style={{ color: '#991b1b', background: '#fee2e2', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>⚠ {state.error}</p>}

        <form action={action}>
          <input type="hidden" name="clientId" value={clientId} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <div style={{ ...fieldS, gridColumn: '1/-1' }}>
              <label style={labelS}>Nombre de tu mascota *</label>
              <input name="name" required style={{ ...inputS, fontSize: '1.05rem', padding: '0.75rem 1rem' }} placeholder="¿Cómo se llama?" />
            </div>
            
            <div style={{ gridColumn: '1/-1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <SearchableSelect 
                label="Especie"
                name="species"
                required
                options={PET_SPECIES}
                value={selectedSpecies}
                onChange={setSelectedSpecies}
                placeholder="Ej: Perro"
              />

              <SearchableSelect 
                label="Raza"
                name="breed"
                options={breeds}
                value={selectedBreed}
                onChange={setSelectedBreed}
                disabled={!selectedSpecies}
                placeholder={selectedSpecies ? "Seleccionar raza..." : "Primero elige especie"}
              />
            </div>

            <div style={fieldS}>
              <label style={labelS}>Género</label>
              <select name="gender" style={inputS}>
                <option value="">No especificado</option>
                <option value="Macho">Macho</option>
                <option value="Hembra">Hembra</option>
              </select>
            </div>
            <div style={fieldS}>
              <label style={labelS}>Peso aproximado (kg)</label>
              <input name="weight" type="number" step="0.1" min="0" style={inputS} placeholder="Ej: 4.5" />
            </div>
            <div style={{ ...fieldS, gridColumn: '1/-1' }}>
              <label style={labelS}>Fecha de Nacimiento (aprox.)</label>
              <input name="birthDate" type="date" style={inputS} />
            </div>
          </div>
          <div style={{ background: '#f0fdf9', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.8rem', color: '#047857', marginBottom: '1.25rem' }}>
            📋 Un veterinario verificará los datos y completará el perfil en tu próxima visita.
          </div>
          <button type="submit" disabled={isPending} style={{
            width: '100%', padding: '0.875rem', background: '#0f766e', color: 'white',
            border: 'none', borderRadius: '0.75rem', cursor: 'pointer', fontFamily: 'inherit',
            fontWeight: '800', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
          }}>
            <PawPrint size={18} />
            {isPending ? 'Registrando...' : 'Registrar Mascota'}
          </button>
        </form>
      </Modal>
    </>
  );
}
