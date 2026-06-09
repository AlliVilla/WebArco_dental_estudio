import React, { useState, useMemo } from 'react';
import { Calendar, User, Search, Eye, Filter, ArrowLeft, Clock } from 'lucide-react';
import { Button, Select, Alert, Card, SectionBlock, StatusBadge, FieldBadge } from '../../../context';
import { DatePickerCalendar } from '../../../components/DatePickerCalendar';
import { useNavigate, useParams } from 'react-router-dom';

interface AppointmentHistoryRecord {
  id: string;
  date: string;
  startTime: string;
  doctorName: string;
  motivo: string;
  status: 'programada' | 'confirmada' | 'cancelada' | 'atendida' | 'ausente' | 'reprogramada';
}

const mockPatientInfo = {
  id: '1',
  name: 'María González',
  phone: '9876-5432',
};

const mockAppointmentHistory: AppointmentHistoryRecord[] = [
  {
    id: '1',
    date: '2026-06-15',
    startTime: '11:00',
    doctorName: 'Dr. López',
    motivo: 'Extracción molar',
    status: 'programada',
  },
  {
    id: '2',
    date: '2026-06-02',
    startTime: '09:00',
    doctorName: 'Dr. Ramírez',
    motivo: 'Limpieza dental',
    status: 'atendida',
  },
  {
    id: '3',
    date: '2026-05-01',
    startTime: '10:30',
    doctorName: 'Dr. Ramírez',
    motivo: 'Revisión general',
    status: 'cancelada',
  },
  {
    id: '4',
    date: '2026-04-12',
    startTime: '14:00',
    doctorName: 'Dra. Karla Arita',
    motivo: 'Ortodoncia - ajuste de brackets',
    status: 'atendida',
  },
  {
    id: '5',
    date: '2026-03-20',
    startTime: '09:30',
    doctorName: 'Dr. López',
    motivo: 'Endodoncia',
    status: 'atendida',
  },
  {
    id: '6',
    date: '2026-02-28',
    startTime: '15:00',
    doctorName: 'Dr. Ramírez',
    motivo: 'Consulta de urgencia',
    status: 'atendida',
  },
  {
    id: '7',
    date: '2026-01-18',
    startTime: '11:30',
    doctorName: 'Dra. Karla Arita',
    motivo: 'Primera consulta',
    status: 'atendida',
  },
  {
    id: '8',
    date: '2026-06-20',
    startTime: '16:00',
    doctorName: 'Dra. Karla Arita',
    motivo: 'Control post-operatorio',
    status: 'confirmada',
  },
  {
    id: '9',
    date: '2026-05-10',
    startTime: '10:00',
    doctorName: 'Dr. López',
    motivo: 'Blanqueamiento dental',
    status: 'ausente',
  },
  {
    id: '10',
    date: '2026-04-05',
    startTime: '13:00',
    doctorName: 'Dr. Ramírez',
    motivo: 'Implante dental',
    status: 'reprogramada',
  },
];

const statusOptions = [
  { value: 'todas', label: 'Todas' },
  { value: 'programada', label: 'Programada' },
  { value: 'confirmada', label: 'Confirmada' },
  { value: 'atendida', label: 'Atendida' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'ausente', label: 'Ausente' },
  { value: 'reprogramada', label: 'Reprogramada' },
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatLongDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function PatientAppointmentHistoryScreen() {
  const navigate = useNavigate();
  const { id } = useParams(); // Using :id from /agenda/:id/history

  const [statusFilter, setStatusFilter] = useState('todas');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredAppointments = useMemo(() => {
    let filtered = [...mockAppointmentHistory];

    // Filtro por estado
    if (statusFilter !== 'todas') {
      filtered = filtered.filter((apt) => apt.status === statusFilter);
    }

    // Filtro por rango de fechas
    if (dateFrom) {
      filtered = filtered.filter((apt) => apt.date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((apt) => apt.date <= dateTo);
    }

    // Ordenar cronológicamente descendente (más reciente primero)
    filtered.sort((a, b) => {
      if (a.date === b.date) {
        return b.startTime.localeCompare(a.startTime);
      }
      return b.date.localeCompare(a.date);
    });

    return filtered;
  }, [statusFilter, dateFrom, dateTo]);

  const hasActiveFilters = statusFilter !== 'todas' || dateFrom || dateTo;

  const clearFilters = () => {
    setStatusFilter('todas');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          Volver
        </Button>
      </div>

      <Alert
        variant="info"
        message="Mostrando el historial completo de citas del paciente en orden cronológico descendente."
      />

      {filteredAppointments.length === 0 && hasActiveFilters && (
        <Alert
          variant="warning"
          message="No se encontraron citas con los filtros seleccionados."
        />
      )}

      <Card>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 24, flexWrap: 'wrap', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Calendar size={20} style={{ color: '#0BC5DF' }} />
            <div>
              <h3 style={{ margin: 0, color: '#203F49' }}>Historial de Citas</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <User size={14} style={{ color: '#888F94' }} />
                <span style={{ fontSize: 13, color: '#888F94' }}>
                  Paciente: <strong style={{ color: '#203F49' }}>{mockPatientInfo.name}</strong>
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={14} />
            {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
          </Button>
        </div>

        {showFilters && (
          <SectionBlock title="Filtros de búsqueda" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <Select
                  label="Filtro por estado"
                  badge="optional"
                  options={statusOptions}
                  value={statusFilter}
                  onChange={setStatusFilter}
                />

                <DatePickerCalendar
                  label="Fecha desde"
                  badge="optional"
                  value={dateFrom}
                  onChange={setDateFrom}
                />

                <DatePickerCalendar
                  label="Fecha hasta"
                  badge="optional"
                  value={dateTo}
                  onChange={setDateTo}
                />
              </div>

              {hasActiveFilters && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#888F94' }}>
                    {filteredAppointments.length} cita{filteredAppointments.length !== 1 ? 's' : ''} encontrada{filteredAppointments.length !== 1 ? 's' : ''}
                  </span>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Limpiar filtros
                  </Button>
                </div>
              )}
            </div>
          </SectionBlock>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%', borderCollapse: 'separate', borderSpacing: 0,
            fontSize: 14,
          }}>
            <thead>
              <tr style={{ background: '#F8F9FA' }}>
                <th style={{
                  padding: '12px 16px', textAlign: 'left',
                  fontSize: 12, fontWeight: 600, color: '#888F94',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  borderBottom: '1px solid #D3D7DA',
                  borderTopLeftRadius: 8,
                }}>
                  Fecha
                </th>
                <th style={{
                  padding: '12px 16px', textAlign: 'left',
                  fontSize: 12, fontWeight: 600, color: '#888F94',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  borderBottom: '1px solid #D3D7DA',
                }}>
                  Hora
                </th>
                <th style={{
                  padding: '12px 16px', textAlign: 'left',
                  fontSize: 12, fontWeight: 600, color: '#888F94',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  borderBottom: '1px solid #D3D7DA',
                }}>
                  Doctor
                </th>
                <th style={{
                  padding: '12px 16px', textAlign: 'left',
                  fontSize: 12, fontWeight: 600, color: '#888F94',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  borderBottom: '1px solid #D3D7DA',
                }}>
                  Motivo
                </th>
                <th style={{
                  padding: '12px 16px', textAlign: 'left',
                  fontSize: 12, fontWeight: 600, color: '#888F94',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  borderBottom: '1px solid #D3D7DA',
                }}>
                  Estado
                </th>
                <th style={{
                  padding: '12px 16px', textAlign: 'right',
                  fontSize: 12, fontWeight: 600, color: '#888F94',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  borderBottom: '1px solid #D3D7DA',
                  borderTopRightRadius: 8,
                }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{
                    padding: 48, textAlign: 'center',
                    color: '#888F94', fontSize: 14,
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <Search size={32} style={{ color: '#D3D7DA' }} />
                      <span>No hay citas registradas</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt, idx) => (
                  <tr
                    key={apt.id}
                    style={{
                      background: '#fff',
                      borderBottom: idx < filteredAppointments.length - 1 ? '1px solid #F1F3F4' : 'none',
                    }}
                  >
                    <td style={{ padding: '16px', color: '#203F49' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 500 }}>{formatDate(apt.date)}</span>
                        <span style={{ fontSize: 11, color: '#888F94' }}>
                          {formatLongDate(apt.date)}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: '#203F49' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={14} style={{ color: '#888F94' }} />
                        {apt.startTime}
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: '#203F49' }}>
                      {apt.doctorName}
                    </td>
                    <td style={{ padding: '16px', color: '#5F656A', maxWidth: 300 }}>
                      <div style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {apt.motivo}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <StatusBadge status={apt.status} />
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/agenda/${apt.id}`)}
                      >
                        <Eye size={14} />
                        Ver detalle
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredAppointments.length > 0 && (
          <div style={{
            marginTop: 16, paddingTop: 16,
            borderTop: '1px solid #F1F3F4',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', fontSize: 13, color: '#888F94',
          }}>
            <span>
              Total: <strong style={{ color: '#203F49' }}>{filteredAppointments.length}</strong> cita{filteredAppointments.length !== 1 ? 's' : ''}
            </span>
            {hasActiveFilters && (
              <span style={{ fontSize: 12 }}>
                Filtros activos
              </span>
            )}
          </div>
        )}
      </Card>

      <div style={{
        background: '#E6F8FB', border: '1px solid #0BC5DF',
        borderRadius: 12, padding: 16,
      }}>
        <div style={{ fontSize: 12, color: '#0899B0', lineHeight: 1.6 }}>
          <strong>Nota:</strong> Este historial muestra todas las citas del paciente {mockPatientInfo.name}.
          Las citas están ordenadas de más reciente a más antigua. Usa los filtros para buscar citas específicas
          por estado o rango de fechas.
        </div>
      </div>
    </div>
  );
}
