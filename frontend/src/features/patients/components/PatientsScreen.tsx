import { useState } from 'react';
import { Users, Search, X, Plus, Eye, FileText } from 'lucide-react';
import { Card, Button, Input } from '../../../context';

interface Patient {
  id: string;
  codigo: string;
  nombre: string;
  telefono: string;
  ultimaVisita: string;
}

const mockPatients: Patient[] = [
  { id: '1', codigo: 'PAC-000124', nombre: 'María Fernanda López García', telefono: '+504 9876-5432', ultimaVisita: '27 may 2026' },
  { id: '2', codigo: 'PAC-000089', nombre: 'José Antonio Rodríguez Cruz', telefono: '+504 9845-1234', ultimaVisita: '24 may 2026' },
  { id: '3', codigo: 'PAC-000156', nombre: 'Ana María Torres Martínez', telefono: '+504 9832-7654', ultimaVisita: '29 may 2026' },
  { id: '4', codigo: 'PAC-000201', nombre: 'Carlos Alberto Mendoza Reyes', telefono: '+504 9878-9012', ultimaVisita: '31 may 2026' },
  { id: '5', codigo: 'PAC-000067', nombre: 'Sofía Isabel Hernández Vargas', telefono: '+504 9856-4321', ultimaVisita: '19 may 2026' },
];

interface PatientsScreenProps {
  onViewProfile?: () => void;
  onCreatePatient?: () => void;
}

export function PatientsScreen({ onViewProfile, onCreatePatient }: PatientsScreenProps) {
  const [searchNombre, setSearchNombre] = useState('');
  const [searchIdentidad, setSearchIdentidad] = useState('');
  const [searchTelefono, setSearchTelefono] = useState('');
  const [searchCodigo, setSearchCodigo] = useState('');

  const limpiarFiltros = () => {
    setSearchNombre('');
    setSearchIdentidad('');
    setSearchTelefono('');
    setSearchCodigo('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Card de Filtros */}
      <Card style={{ border: '1px solid #D3D7DA', borderRadius: 12 }}>
        <div style={{ padding: 21 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#203F49', marginBottom: 4 }}>
              Filtros de búsqueda
            </h3>
            <p style={{ fontSize: 12, color: '#888F94', marginBottom: 20 }}>
              Ingresa al menos un criterio para buscar pacientes
            </p>

            {/* Grid de inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <Input label="Búsqueda por nombre" badge="optional" placeholder="Ej: María López"
                icon={<Search size={15} />} value={searchNombre} onChange={(e) => setSearchNombre(e.target.value)} />
              <Input label="Búsqueda por número de identidad" badge="optional" placeholder="Ej: 0801-1990-12345"
                icon={<Users size={15} />} value={searchIdentidad} onChange={(e) => setSearchIdentidad(e.target.value)} />
              <Input label="Búsqueda por teléfono" badge="optional" placeholder="Ej: 9876-5432"
                icon={<Search size={15} />} value={searchTelefono} onChange={(e) => setSearchTelefono(e.target.value)} />
              <Input label="Búsqueda por código autogenerado" badge="optional" placeholder="Ej: PAC-000124"
                icon={<FileText size={15} />} value={searchCodigo} onChange={(e) => setSearchCodigo(e.target.value)} />
            </div>

            {/* Botones de acción */}
            <div style={{ display: 'flex', gap: 12 }}>
              <Button variant="primary" style={{ flex: 1 }} disabled>
                <Search size={16} />
                Buscar paciente
              </Button>
              <Button
                variant="secondary"
                onClick={limpiarFiltros}
                style={{ gap: 8 }}
              >
                <X size={16} />
                Limpiar filtros
              </Button>
              <Button style={{ background: '#0BC5DF', color: '#fff', gap: 8 }} onClick={onCreatePatient}>
                <Plus size={16} />
                Crear nuevo paciente
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Card de Listado */}
      <Card style={{ border: '1px solid #D3D7DA', borderRadius: 12 }}>
        <div style={{ padding: 21 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#203F49', marginBottom: 4 }}>
              Listado de pacientes
            </h3>
            <p style={{ fontSize: 12, color: '#888F94', marginBottom: 16 }}>
              Total de {mockPatients.length} pacientes registrados
            </p>

            {/* Tabla */}
            <div style={{ border: '1px solid #D3D7DA', borderRadius: 8, overflow: 'hidden' }}>
              {/* Header */}
              <div style={{
                background: '#F8F9FA',
                borderBottom: '1px solid #D3D7DA',
                padding: '19px 15px',
                display: 'grid',
                gridTemplateColumns: '140px 1fr 160px 130px 90px',
                gap: 24
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#888F94', letterSpacing: '0.66px', textTransform: 'uppercase' }}>
                  Código del paciente
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#888F94', letterSpacing: '0.66px', textTransform: 'uppercase' }}>
                  Nombre completo
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#888F94', letterSpacing: '0.66px', textTransform: 'uppercase' }}>
                  Teléfono
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#888F94', letterSpacing: '0.66px', textTransform: 'uppercase' }}>
                  Fecha última visita
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#888F94', letterSpacing: '0.66px', textTransform: 'uppercase' }}>
                  Acciones
                </div>
              </div>

              {/* Rows */}
              {mockPatients.map((patient, index) => (
                <div
                  key={patient.id}
                  onClick={() => onViewProfile?.()}
                  style={{
                    background: index % 2 === 0 ? '#FFFFFF' : '#F8F9FA',
                    borderBottom: index < mockPatients.length - 1 ? '1px solid #F1F3F4' : 'none',
                    padding: '18px 15px',
                    display: 'grid',
                    gridTemplateColumns: '140px 1fr 160px 130px 90px',
                    gap: 24,
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#E6F8FB';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = index % 2 === 0 ? '#FFFFFF' : '#F8F9FA';
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#0BC5DF' }}>
                    {patient.codigo}
                  </div>
                  <div style={{ fontSize: 13, color: '#203F49' }}>
                    {patient.nombre}
                  </div>
                  <div style={{ fontSize: 13, color: '#5F656A' }}>
                    {patient.telefono}
                  </div>
                  <div style={{ fontSize: 13, color: '#5F656A' }}>
                    {patient.ultimaVisita}
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewProfile?.();
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: 6,
                        cursor: 'pointer',
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Eye size={16} color="#888F94" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewProfile?.();
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: 6,
                        cursor: 'pointer',
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <FileText size={15} color="#888F94" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
