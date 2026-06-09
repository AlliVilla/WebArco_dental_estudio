import React, { useState, useEffect, useRef } from 'react';
import { Search, User, CheckCircle2 } from 'lucide-react';
import { Input, FieldBadge } from '../../../context';
import { appointmentService } from '../services/appointmentService';

interface Patient {
  id_persona: number;
  primer_nombre: string;
  primer_apellido: string;
  numero_identidad: string;
}

interface PatientSearchInputProps {
  value?: number;
  onChange: (id: number) => void;
  error?: string;
  disabled?: boolean;
}

export const PatientSearchInput: React.FC<PatientSearchInputProps> = ({ value, onChange, error, disabled }) => {
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Si tenemos un value inicial pero no un paciente seleccionado, deberíamos buscarlo
    // Para simplificar, asumimos que si el valor cambia de afuera y query está vacío, lo reseteamos.
    if (!value) {
      setSelectedPatient(null);
      setQuery('');
    }
  }, [value]);

  useEffect(() => {
    const searchPatients = async () => {
      if (!query.trim()) {
        setPatients([]);
        return;
      }
      setLoading(true);
      try {
        const res = await appointmentService.getPersonas(query);
        if (res.success && res.data) {
          setPatients(res.data);
        }
      } catch (err) {
        console.error('Error fetching patients:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchPatients, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    onChange(patient.id_persona);
    setIsOpen(false);
    setQuery('');
  };

  const handleClear = () => {
    setSelectedPatient(null);
    onChange(0);
    setQuery('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }} ref={containerRef}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>Paciente</label>
        <FieldBadge type="required" />
      </div>

      {selectedPatient || value ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          border: `1px solid ${error ? '#E24B4A' : '#0BC5DF'}`,
          borderRadius: 8, padding: '10px 12px', background: '#E6F8FB'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0BC5DF', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12 }}>
              {selectedPatient?.primer_nombre[0] || 'P'}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#203F49' }}>
                {selectedPatient ? `${selectedPatient.primer_nombre} ${selectedPatient.primer_apellido}` : `Paciente Seleccionado (ID: ${value})`}
              </div>
              <div style={{ fontSize: 12, color: '#0BC5DF', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={12} />
                {selectedPatient?.numero_identidad || ''}
              </div>
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              style={{ background: 'transparent', border: 'none', color: '#5F656A', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}
            >
              Cambiar
            </button>
          )}
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#888F94' }} />
            <input
              type="text"
              placeholder="Buscar paciente por nombre o identidad..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              disabled={disabled}
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                borderRadius: 8,
                border: `1px solid ${error ? '#E24B4A' : isOpen ? '#0BC5DF' : '#D3D7DA'}`,
                outline: 'none',
                fontSize: 14,
                fontFamily: 'inherit',
                transition: 'all 0.2s',
                boxShadow: isOpen ? '0 0 0 3px rgba(11,197,223,0.12)' : 'none',
                background: disabled ? '#F8F9FA' : '#fff',
                color: '#203F49'
              }}
            />
          </div>

          {isOpen && query.trim() !== '' && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 4,
              background: '#fff',
              border: '1px solid #D3D7DA',
              borderRadius: 8,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              maxHeight: 250,
              overflowY: 'auto',
              zIndex: 100
            }}>
              {loading ? (
                <div style={{ padding: 12, textAlign: 'center', color: '#888F94', fontSize: 13 }}>Buscando...</div>
              ) : patients.length === 0 ? (
                <div style={{ padding: 12, textAlign: 'center', color: '#888F94', fontSize: 13 }}>No se encontraron resultados</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {patients.map((patient) => (
                    <button
                      key={patient.id_persona}
                      type="button"
                      onClick={() => handleSelect(patient)}
                      style={{
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        border: 'none',
                        background: 'transparent',
                        borderBottom: '1px solid #F1F3F4',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F8F9FA'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <User size={16} style={{ color: '#0BC5DF' }} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#203F49' }}>{patient.primer_nombre} {patient.primer_apellido}</div>
                        <div style={{ fontSize: 12, color: '#888F94' }}>Identidad: {patient.numero_identidad}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <span style={{ fontSize: 11, color: '#E24B4A' }}>{error}</span>
      )}
    </div>
  );
};
