import { useState, useEffect, useCallback } from 'react';
import { Calendar, User, Search, Eye, Filter, ArrowLeft, Clock } from 'lucide-react';
import { Button, Select, Alert, Card, SectionBlock, StatusBadge } from '../../../context';
import { Spinner } from '../../../components';
import { DatePickerCalendar } from '../../../components/DatePickerCalendar';
import { useNavigate, useParams } from 'react-router-dom';
import { appointmentService } from '../services/appointmentService';
import type { Appointment } from '../types';
import { formatShortDate, formatLongDate } from '../utils';

export function PatientAppointmentHistoryScreen() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [patientId, setPatientId] = useState<number | null>(null);
  const [patientName, setPatientName] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const fetchAppointmentPatient = useCallback(async () => {
    if (!id) return;
    try {
      const res = await appointmentService.getById(Number(id));
      if (res.success && res.data) {
        setPatientId(res.data.id_persona);
        const name = `${res.data.persona?.primer_nombre || ''} ${res.data.persona?.primer_apellido || ''}`.trim();
        setPatientName(name || `Paciente #${res.data.id_persona}`);
      } else {
        setError('No se pudo obtener la información del paciente');
      }
    } catch (err: any) {
      setError(err?.message || 'Error al cargar datos del paciente');
    }
  }, [id]);

  useEffect(() => {
    fetchAppointmentPatient();
  }, [fetchAppointmentPatient]);

  const fetchHistory = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError('');
    try {
      const params: Record<string, unknown> = {
        page,
        limit: pagination.limit,
      };
      if (statusFilter) params.estado = statusFilter;
      if (dateFrom) params.start = dateFrom;
      if (dateTo) params.end = `${dateTo}T23:59:59`;

      const res = await appointmentService.getPatientHistory(patientId, params);
      if (res.success && res.data) {
        setAppointments(res.data.data);
        setPagination(res.data.pagination);
      } else {
        setError(res.message || 'Error al cargar el historial');
      }
    } catch (err: any) {
      setError(err?.message || 'Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  }, [patientId, page, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const clearFilters = () => {
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const hasActiveFilters = statusFilter || dateFrom || dateTo;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          Volver
        </Button>
      </div>

      {error && <Alert variant="error" message={error} onClose={() => setError('')} />}

      {appointments.length === 0 && !loading && !error && (
        <Alert
          variant="info"
          message="No se encontraron citas en el historial de este paciente."
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
                  Paciente: <strong style={{ color: '#203F49' }}>{patientName || 'Cargando...'}</strong>
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
                  options={[
                    { value: '', label: 'Todas' },
                    { value: 'programada', label: 'Programada' },
                    { value: 'confirmada', label: 'Confirmada' },
                    { value: 'atendida', label: 'Atendida' },
                    { value: 'cancelada', label: 'Cancelada' },
                    { value: 'ausente', label: 'Ausente' },
                    { value: 'reprogramada', label: 'Reprogramada' },
                  ]}
                  value={statusFilter}
                  onChange={(v) => { setStatusFilter(v.toString()); setPage(1); }}
                />

                <DatePickerCalendar
                  label="Fecha desde"
                  badge="optional"
                  value={dateFrom}
                  onChange={(d) => { setDateFrom(d); setPage(1); }}
                />

                <DatePickerCalendar
                  label="Fecha hasta"
                  badge="optional"
                  value={dateTo}
                  onChange={(d) => { setDateTo(d); setPage(1); }}
                />
              </div>

              {hasActiveFilters && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Limpiar filtros
                  </Button>
                </div>
              )}
            </div>
          </SectionBlock>
        )}

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}><Spinner /></div>
        ) : (
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
                {appointments.length === 0 ? (
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
                  appointments.map((apt, idx) => (
                    <tr
                      key={apt.id_cita}
                      style={{
                        background: '#fff',
                        borderBottom: idx < appointments.length - 1 ? '1px solid #F1F3F4' : 'none',
                      }}
                    >
                      <td style={{ padding: '16px', color: '#203F49' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontWeight: 500 }}>{formatShortDate(apt.fecha_inicio.split('T')[0])}</span>
                          <span style={{ fontSize: 11, color: '#888F94' }}>
                            {formatLongDate(apt.fecha_inicio.split('T')[0])}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: '#203F49' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Clock size={14} style={{ color: '#888F94' }} />
                          {apt.fecha_inicio.substring(11, 16)}
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: '#203F49' }}>
                        {apt.doctor ? `${apt.doctor.persona.primer_nombre} ${apt.doctor.persona.primer_apellido}` : 'N/A'}
                      </td>
                      <td style={{ padding: '16px', color: '#5F656A', maxWidth: 300 }}>
                        <div style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {apt.motivo || apt.tipo_cita || 'General'}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <StatusBadge status={apt.estado} />
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/agenda/${apt.id_cita}`)}
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
        )}

        {appointments.length > 0 && (
          <div style={{
            marginTop: 16, paddingTop: 16,
            borderTop: '1px solid #F1F3F4',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', fontSize: 13, color: '#888F94',
          }}>
            <span>
              Total: <strong style={{ color: '#203F49' }}>{pagination.total}</strong> cita{pagination.total !== 1 ? 's' : ''}
              {pagination.pages > 1 && ` (pág. ${pagination.page} de ${pagination.pages})`}
            </span>

            {pagination.pages > 1 && (
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
