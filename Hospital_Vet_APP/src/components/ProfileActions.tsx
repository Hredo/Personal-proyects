'use client';

import { useActionState, useState, useEffect } from 'react';
import { updateClientProfile, updatePatient } from '@/lib/actions';
import Modal from '@/components/Modal';
import { User, Settings, Edit2, PawPrint, Save } from 'lucide-react';
import { PET_SPECIES, PET_BREEDS } from '@/lib/pet-data';
import { SearchableSelect } from '@/components/SearchableSelect';

const inputS: React.CSSProperties = {
  width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem',
  border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '0.9rem', fontFamily: 'inherit'
};
const labelS: React.CSSProperties = { fontSize: '0.78rem', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '0.3rem' };
const fieldS: React.CSSProperties = { marginBottom: '1rem' };

export function EditProfileButton({ user, client }: { user: any, client: any }) {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState(updateClientProfile, null);

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)',
        padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer',
        fontSize: '0.85rem', fontWeight: '600'
      }}>
        <Settings size={16} /> Editar Perfil
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Editar Mi Perfil">
        {state?.success && <p style={{ color: '#166534', background: '#dcfce7', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>✓ {state.success}</p>}
        {state?.error && <p style={{ color: '#991b1b', background: '#fee2e2', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>⚠ {state.error}</p>}
        
        <form action={action}>
          <input type="hidden" name="userId" value={user.id} />
          <div style={fieldS}>
            <label style={labelS}>Nombre Completo</label>
            <input name="name" defaultValue={user.name} required style={inputS} />
          </div>
          <div style={fieldS}>
            <label style={labelS}>Email de contacto</label>
            <input name="email" type="email" defaultValue={user.email} required style={inputS} />
          </div>
          <div style={fieldS}>
            <label style={labelS}>Teléfono</label>
            <input name="phone" defaultValue={client.phone} style={inputS} />
          </div>
          <div style={fieldS}>
            <label style={labelS}>Dirección</label>
            <input name="address" defaultValue={client.address} style={inputS} />
          </div>
          
          <button type="submit" disabled={isPending} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            {isPending ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </Modal>
    </>
  );
}

export function EditPetButton({ pet }: { pet: any }) {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState(updatePatient, null);
  
  const [selectedSpecies, setSelectedSpecies] = useState(pet.species || '');
  const [selectedBreed, setSelectedBreed] = useState(pet.breed || '');

  const breeds = selectedSpecies ? (PET_BREEDS[selectedSpecies] || ["Otro"]) : [];

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0',
        padding: '0.4rem 0.8rem', borderRadius: '0.5rem', cursor: 'pointer',
        fontSize: '0.75rem', fontWeight: '600'
      }}>
        <Edit2 size={12} /> Editar Datos
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={`Editar a ${pet.name}`}>
        {state?.success && <p style={{ color: '#166534', background: '#dcfce7', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>✓ {state.success}</p>}
        {state?.error && <p style={{ color: '#991b1b', background: '#fee2e2', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>⚠ {state.error}</p>}

        <form action={action}>
          <input type="hidden" name="id" value={pet.id} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <div style={{ ...fieldS, gridColumn: '1/-1' }}>
              <label style={labelS}>Nombre</label>
              <input name="name" defaultValue={pet.name} required style={inputS} />
            </div>
            
            <div style={{ gridColumn: '1/-1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <SearchableSelect 
                label="Especie"
                name="species"
                required
                options={PET_SPECIES}
                value={selectedSpecies}
                onChange={setSelectedSpecies}
              />

              <SearchableSelect 
                label="Raza"
                name="breed"
                options={breeds}
                value={selectedBreed}
                onChange={setSelectedBreed}
                disabled={!selectedSpecies}
              />
            </div>

            <div style={fieldS}>
              <label style={labelS}>Género</label>
              <select name="gender" defaultValue={pet.gender || ""} style={inputS}>
                <option value="">No especificado</option>
                <option value="Macho">Macho</option>
                <option value="Hembra">Hembra</option>
              </select>
            </div>
            <div style={fieldS}>
              <label style={labelS}>Peso (kg)</label>
              <input name="weight" type="number" step="0.1" defaultValue={pet.weight || ""} style={inputS} />
            </div>
            <div style={{ ...fieldS, gridColumn: '1/-1' }}>
              <label style={labelS}>Fecha Nacimiento</label>
              <input name="birthDate" type="date" defaultValue={pet.birthDate?.split(' ')[0] || ""} style={inputS} />
            </div>
          </div>
          
          <button type="submit" disabled={isPending} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            <Save size={18} style={{ marginRight: '0.5rem' }} />
            {isPending ? 'Actualizando...' : 'Actualizar Mascota'}
          </button>
        </form>
      </Modal>
    </>
  );
}
