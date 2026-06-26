import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import type { Patient } from '../../../types';

function stripAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function getAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

interface PatientComboboxProps {
  patients: Patient[];
  value: number | null;
  onChange: (id: number) => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
}

export function PatientCombobox({
  patients,
  value,
  onChange,
  disabled,
  loading,
  placeholder = 'Buscar paciente...',
}: PatientComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedPatient = useMemo(
    () => patients.find(p => p.id === value) || null,
    [patients, value],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFilter('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const plainFilter = stripAccents(filter.toLowerCase());

  const filtered = useMemo(() => {
    if (!filter.trim()) return patients;
    return patients.filter(p => {
      const text = stripAccents(`${p.nombre} ${p.apellido} ${p.identidad}`.toLowerCase());
      return text.includes(plainFilter);
    });
  }, [patients, filter, plainFilter]);

  const handleSelect = (patient: Patient) => {
    onChange(patient.id);
    setIsOpen(false);
    setFilter('');
  };

  const selectedLabel = selectedPatient
    ? `${selectedPatient.nombre} ${selectedPatient.apellido}`
    : '';

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div
        onClick={() => { if (!disabled) setIsOpen(!isOpen); }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '8px 36px 8px 12px',
          borderRadius: 8,
          border: `1px solid ${isOpen ? '#0BC5DF' : '#D3D7DA'}`,
          fontSize: 13,
          fontWeight: 600,
          color: selectedPatient ? '#203F49' : '#888F94',
          background: disabled ? '#F8F9FA' : '#ffffff',
          outline: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxSizing: 'border-box',
          transition: 'all 0.2s',
          boxShadow: isOpen ? '0 0 0 3px rgba(11,197,223,0.12)' : 'none',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {loading
            ? 'Cargando pacientes...'
            : selectedLabel
              ? `${selectedLabel} (${getAge(selectedPatient!.fecha_nacimiento)} años)`
              : placeholder}
        </span>
        <ChevronDown size={15} style={{ color: '#888F94', flexShrink: 0, marginLeft: 8 }} />
      </div>

      {isOpen && !disabled && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 100,
          marginTop: 4,
          background: '#fff',
          border: '1px solid #D3D7DA',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'relative', borderBottom: '1px solid #F1F3F4' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: 11, color: '#888F94' }} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar por nombre o identidad..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                padding: '10px 12px 10px 36px',
                fontSize: 14,
                fontFamily: 'inherit',
                color: '#203F49',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ maxHeight: 250, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 12, textAlign: 'center', color: '#888F94', fontSize: 13 }}>
                {filter ? 'Sin resultados' : 'No hay pacientes registrados'}
              </div>
            ) : (
              filtered.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => handleSelect(patient)}
                  style={{
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    borderBottom: '1px solid #F1F3F4',
                    background: patient.id === value ? 'rgba(11,197,223,0.08)' : 'transparent',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F8F9FA'; }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = patient.id === value ? 'rgba(11,197,223,0.08)' : 'transparent';
                  }}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: '#0BC5DF',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: 12,
                    flexShrink: 0,
                  }}>
                    {patient.nombre[0] || '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#203F49' }}>
                      {patient.nombre} {patient.apellido}
                      <span style={{ fontWeight: 400, color: '#888F94', marginLeft: 6 }}>
                        ({getAge(patient.fecha_nacimiento)} años)
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#888F94' }}>
                      {patient.identidad}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
