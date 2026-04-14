'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

interface SearchableSelectProps {
  label: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
}

export function SearchableSelect({ 
  label, 
  options, 
  value, 
  onChange, 
  placeholder = "Seleccionar...", 
  name, 
  required,
  disabled 
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = useMemo(() => {
    return options.filter(opt => 
      opt.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (opt: string) => {
    onChange(opt);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', marginBottom: '1rem' }}>
      <label style={{ 
        fontSize: '0.78rem', 
        fontWeight: '700', 
        color: '#374151', 
        display: 'block', 
        marginBottom: '0.3rem' 
      }}>
        {label} {required && '*'}
      </label>
      
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '0.65rem 0.85rem',
          borderRadius: '0.5rem',
          border: '1.5px solid #e2e8f0',
          background: disabled ? '#f8fafc' : 'white',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.9rem',
          minHeight: '40px',
          boxSizing: 'border-box'
        }}
      >
        <span style={{ color: value ? '#1e293b' : '#94a3b8' }}>
          {value || placeholder}
        </span>
        <ChevronDown size={16} style={{ 
          color: '#64748b', 
          transform: isOpen ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.2s'
        }} />
      </div>

      <input type="hidden" name={name} value={value} required={required} />

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 100,
          background: 'white',
          border: '1.5px solid #e2e8f0',
          borderRadius: '0.5rem',
          marginTop: '0.25rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}>
          <div style={{ 
            padding: '0.5rem', 
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Search size={14} color="#94a3b8" />
            <input 
              autoFocus
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: '0.85rem',
                fontFamily: 'inherit'
              }}
            />
            {search && (
              <X 
                size={14} 
                color="#94a3b8" 
                style={{ cursor: 'pointer' }} 
                onClick={() => setSearch("")} 
              />
            )}
          </div>
          
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div 
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  style={{
                    padding: '0.6rem 0.85rem',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: value === opt ? '#f0fdfa' : 'transparent',
                    color: value === opt ? '#0f766e' : '#1e293b'
                  }}
                  onMouseEnter={(e) => {
                    if (value !== opt) e.currentTarget.style.background = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    if (value !== opt) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {opt}
                  {value === opt && <Check size={14} />}
                </div>
              ))
            ) : (
              <div style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#64748b', textAlign: 'center' }}>
                No se encontraron resultados
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
