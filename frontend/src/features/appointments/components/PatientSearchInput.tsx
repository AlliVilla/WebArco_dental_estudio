import { useState, useEffect, useRef } from 'react';
import { User, CheckCircle2, ChevronDown, Search } from 'lucide-react';
import { FieldBadge } from '../../../context';
import { appointmentService } from '../services/appointmentService';
import type { PersonaRecord } from '../types';

interface PatientSearchInputProps {
  value?: number;
  onChange: (id: number) => void;
  error?: string;
  disabled?: boolean;
  initialPatient?: { nombre: string; identidad: string } | null;
}

function stripAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function PatientSearchInput({ value, onChange, error, disabled, initialPatient }: PatientSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [patients, setPatients] = useState<PersonaRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PersonaRecord | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    if (!value) {
      setSelectedPatient(null);
    }
  }, [value]);

  useEffect(() => {
    setLoading(true);
    appointmentService.getPersonas()
      .then((res) => {
        if (res.success && res.data) {
          setPatients(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const plainFilter = stripAccents(filter.toLowerCase());

  const filtered = patients.filter((p) => {
    if (!filter.trim()) return true;
    const fullName = stripAccents(`${p.primer_nombre} ${p.primer_apellido} ${p.numero_identidad}`.toLowerCase());
    return fullName.includes(plainFilter);
  });

  const handleSelect = (patient: PersonaRecord) => {
    setSelectedPatient(patient);
    onChange(patient.id_persona);
    setIsOpen(false);
    setFilter('');
  };

  const handleClear = () => {
    setSelectedPatient(null);
    onChange(0);
  };

  const selectedLabel = selectedPatient
    ? `${selectedPatient.primer_nombre} ${selectedPatient.primer_apellido}`
    : initialPatient?.nombre ?? (value ? `Paciente #${value}` : '');
  const selectedIdentity = selectedPatient?.numero_identidad ?? initialPatient?.identidad ?? '';
  const selectedInitial = selectedPatient?.primer_nombre?.[0] || initialPatient?.nombre?.[0] || 'P';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }} ref={containerRef}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>Paciente</label>
        <FieldBadge type="required" />
      </div>

      <div style={{ position: 'relative' }}>
        <div
          onClick={() => { if (!disabled) setIsOpen(!isOpen); }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            border: `1px solid ${error ? '#E24B4A' : isOpen ? '#0BC5DF' : '#D3D7DA'}`,
            borderRadius: 8, padding: '10px 12px',
            background: disabled ? '#F8F9FA' : '#fff',
            cursor: disabled ? 'not-allowed' : 'pointer',
            boxShadow: isOpen ? '0 0 0 3px rgba(11,197,223,0.12)' : 'none',
          }}
        >
          {selectedPatient || value ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: '#0BC5DF',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 600, fontSize: 12,
              }}>
                {selectedInitial}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#203F49' }}>
                  {selectedLabel}
                </div>
                <div style={{ fontSize: 12, color: '#0BC5DF', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={12} />
                  {selectedIdentity}
                </div>
              </div>
            </div>
          ) : (
            <span style={{ fontSize: 14, color: '#888F94' }}>
              {loading ? 'Cargando pacientes...' : 'Seleccionar paciente'}
            </span>
          )}
          <ChevronDown size={15} style={{ color: '#888F94', flexShrink: 0 }} />
        </div>

        {isOpen && !disabled && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
            marginTop: 4, background: '#fff', border: '1px solid #D3D7DA',
            borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'relative', borderBottom: '1px solid #F1F3F4' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: 11, color: '#888F94' }} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar paciente..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%', border: 'none', outline: 'none',
                  padding: '10px 12px 10px 36px', fontSize: 14,
                  fontFamily: 'inherit', color: '#203F49',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ maxHeight: 250, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: 12, textAlign: 'center', color: '#888F94', fontSize: 13 }}>
                  Cargando...
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: 12, textAlign: 'center', color: '#888F94', fontSize: 13 }}>
                  {filter ? 'Sin resultados' : 'No hay pacientes registrados'}
                </div>
              ) : (
                filtered.map((patient) => (
                  <div
                    key={patient.id_persona}
                    onClick={() => handleSelect(patient)}
                    style={{
                      padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
                      cursor: 'pointer', borderBottom: '1px solid #F1F3F4',
                      background: patient.id_persona === (selectedPatient?.id_persona ?? value)
                        ? 'rgba(11,197,223,0.08)' : 'transparent',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F8F9FA'; }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = patient.id_persona === (selectedPatient?.id_persona ?? value)
                        ? 'rgba(11,197,223,0.08)' : 'transparent';
                    }}
                  >
                    <User size={16} style={{ color: '#0BC5DF', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#203F49' }}>
                        {patient.primer_nombre} {patient.primer_apellido}
                      </div>
                      <div style={{ fontSize: 12, color: '#888F94' }}>
                        {patient.numero_identidad}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {!!(selectedPatient || value) && (
              <div
                onClick={handleClear}
                style={{
                  padding: '10px 12px', textAlign: 'center', cursor: 'pointer',
                  fontSize: 13, color: '#E24B4A', fontWeight: 500,
                  borderTop: '1px solid #F1F3F4',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                Quitar selección
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <span style={{ fontSize: 11, color: '#E24B4A' }}>{error}</span>
      )}
    </div>
  );
}
