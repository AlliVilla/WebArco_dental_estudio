import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Plus, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Button, Select, Alert, StatusBadge } from '../../../context';
import { Spinner } from '../../../components';
import { AppointmentQuickView } from './AppointmentQuickView';
import { appointmentService } from '../services/appointmentService';
import { Appointment } from '../types';
import { useNavigate } from 'react-router-dom';

const timeSlots = Array.from({ length: 13 }, (_, i) => {
  const hour = 8 + i;
  return `${hour.toString().padStart(2, '0')}:00`;
});

const statusColorMap: Record<string, string> = {
  programada: '#0BC5DF',
  confirmada: '#1D9E75',
  cancelada: '#E24B4A',
  atendida: '#203F49',
  ausente: '#EF9F27',
  reprogramada: '#3B82F6',
};

function getWeekDays(baseDate: Date): Date[] {
  const startOfWeek = new Date(baseDate);
  const day = startOfWeek.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  startOfWeek.setDate(startOfWeek.getDate() + diff);

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return date;
  });
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDayLabel(date: Date): string {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return days[date.getDay()];
}

function formatMonthYear(date: Date): string {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function AppointmentsScreen() {
  const navigate = useNavigate();
  const [viewType, setViewType] = useState<'day' | 'week'>('week');
  const [selectedDoctor, setSelectedDoctor] = useState('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const weekDays = getWeekDays(currentDate);
      const dates = viewType === 'week' ? weekDays : [currentDate];
      const start = formatDate(dates[0]);
      const end = formatDate(dates[dates.length - 1]);
      const doctorId = selectedDoctor !== 'all' ? Number(selectedDoctor) : undefined;
      const res = await appointmentService.getByCalendar(start, end, doctorId);
      if (res.success) {
        setAppointments(res.data);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      if (err?.statusCode === 403) {
        setLoading(false);
        navigate('/dashboard', { state: { noPermission: true, section: 'agenda' }, replace: true });
        return;
      }
      setError(err?.message || 'Error al cargar citas');
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewType, selectedDoctor, navigate]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const displayDates = useMemo(() => viewType === 'week' ? weekDays : [currentDate], [viewType, weekDays, currentDate]);

  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewType === 'week') {
      newDate.setDate(currentDate.getDate() - 7);
    } else {
      newDate.setDate(currentDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewType === 'week') {
      newDate.setDate(currentDate.getDate() + 7);
    } else {
      newDate.setDate(currentDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const res = await appointmentService.getUsuarios();
        if (res.success && res.data) {
          const mapped = res.data.map((u: any) => ({
            value: String(u.id_usuario),
            label: `Dr(a). ${u.persona?.primer_nombre || ''} ${u.persona?.primer_apellido || ''}`.trim(),
          }));
          setDoctors([{ value: 'all', label: 'Todos los doctores' }, ...mapped]);
        }
      } catch {
        // fallback
      }
    };
    loadDoctors();
  }, []);

  const getAppointmentsForSlot = (date: Date, timeSlot: string) => {
    const dateStr = formatDate(date);
    const hourPrefix = timeSlot.split(':')[0];
    return appointments.filter((apt) => {
      const aptDateStr = apt.fecha_inicio.split('T')[0];
      const aptTime = apt.fecha_inicio.substring(11, 16);
      return aptDateStr === dateStr && aptTime.startsWith(hourPrefix);
    });
  };

  const selectedDoctorName = doctors.find((d) => d.value === selectedDoctor)?.label || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%', overflowY: 'auto' }}>
      {selectedDoctor !== 'all' && (
        <Alert
          variant="info"
          message={`Estás viendo la agenda del ${selectedDoctorName}. Cambia el selector para ver otro doctor.`}
        />
      )}

      {error && <Alert variant="error" message={error} onClose={() => setError('')} />}

      {!loading && appointments.length === 0 && !error && (
        <Alert
          variant="warning"
          message="No hay citas programadas para este periodo."
        />
      )}

      <div style={{
        background: '#fff', border: '0.5px solid #D3D7DA',
        borderRadius: 12, padding: 24, flex: 1, display: 'flex', flexDirection: 'column'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 24, flexWrap: 'wrap', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Calendar size={20} style={{ color: '#0BC5DF' }} />
            <h3 style={{ margin: 0, color: '#203F49', fontSize: 18 }}>Calendario de Citas</h3>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 160 }}>
              <Select
                label="Vista"
                badge="required"
                options={[
                  { value: 'day', label: 'Día' },
                  { value: 'week', label: 'Semana' },
                ]}
                value={viewType}
                onChange={(v) => setViewType(v as 'day' | 'week')}
              />
            </div>

            <div style={{ minWidth: 200 }}>
              <Select
                label="Doctor"
                badge="conditional"
                options={doctors.length > 0 ? doctors : [{ value: 'all', label: 'Cargando...' }]}
                value={selectedDoctor}
                onChange={(v) => setSelectedDoctor(v.toString())}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <Button variant="primary" onClick={() => navigate('/agenda/new')}>
                <Plus size={16} />
                Nueva cita
              </Button>
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #F1F3F4',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={goToPrevious}
              style={{
                background: '#fff', border: '1px solid #D3D7DA',
                borderRadius: 6, padding: 8, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ChevronLeft size={16} style={{ color: '#203F49' }} />
            </button>
            <button
              onClick={goToNext}
              style={{
                background: '#fff', border: '1px solid #D3D7DA',
                borderRadius: 6, padding: 8, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ChevronRight size={16} style={{ color: '#203F49' }} />
            </button>
            <Button variant="secondary" size="sm" onClick={goToToday}>
              Hoy
            </Button>
          </div>

          <h4 style={{ margin: 0, color: '#203F49', fontSize: 16 }}>
            {viewType === 'week'
              ? formatMonthYear(currentDate)
              : `${currentDate.getDate()} de ${formatMonthYear(currentDate)}`}
          </h4>
        </div>

        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Spinner />
          </div>
        ) : (
          <div style={{ overflowX: 'auto', flex: 1, minHeight: 400 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `80px repeat(${displayDates.length}, minmax(${viewType === 'week' ? '120px' : '300px'}, 1fr))`,
              gap: 8,
              minWidth: viewType === 'week' ? 900 : 400,
            }}>
              <div style={{ position: 'sticky', left: 0, background: '#fff', zIndex: 2 }} />
              {displayDates.map((date, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '8px 12px',
                    textAlign: 'center',
                    background: formatDate(date) === formatDate(new Date()) ? '#E6F8FB' : '#F8F9FA',
                    borderRadius: 8,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#888F94', textTransform: 'uppercase' }}>
                    {formatDayLabel(date)}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#203F49', marginTop: 2 }}>
                    {date.getDate()}
                  </div>
                </div>
              ))}

              {timeSlots.map((timeSlot) => (
                <React.Fragment key={timeSlot}>
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
                    padding: '8px 12px', fontSize: 12, color: '#888F94',
                    position: 'sticky', left: 0, background: '#fff', zIndex: 1,
                  }}>
                    {timeSlot}
                  </div>

                  {displayDates.map((date, idx) => {
                    const dayAppointments = getAppointmentsForSlot(date, timeSlot);
                    return (
                      <div
                        key={`${timeSlot}-${idx}`}
                        style={{
                          minHeight: 60,
                          border: '1px solid #F1F3F4',
                          borderRadius: 6,
                          padding: 4,
                          background: '#FAFBFB',
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4
                        }}
                      >
                        {dayAppointments.map((apt, aptIdx) => {
                          const bgColor = statusColorMap[apt.estado] || '#0BC5DF';
                          let durationHours = 1;
                          if (apt.fecha_fin) {
                            const diff = new Date(apt.fecha_fin).getTime() - new Date(apt.fecha_inicio).getTime();
                            durationHours = Math.max(1, Math.round(diff / 3600000));
                          }

                          const height = durationHours * 60 + ((durationHours - 1) * 8);
                          const total = dayAppointments.length;
                          const useAbsolute = durationHours > 1 || total > 1;

                          let left: string | number = 'auto';
                          let right: string | number = 'auto';
                          let width: string | number = 'auto';
                          if (useAbsolute) {
                            if (total === 1) {
                              left = 4;
                              right = 4;
                            } else {
                              left = `calc(${(100 / total) * aptIdx}% + 2px)`;
                              width = `calc(${100 / total}% - 4px)`;
                            }
                          }

                          return (
                            <div
                              key={apt.id_cita}
                              onClick={() => setSelectedAppointment(apt)}
                              style={{
                                background: bgColor,
                                borderRadius: 6,
                                padding: 8,
                                cursor: 'pointer',
                                height: useAbsolute ? height : undefined,
                                minHeight: useAbsolute ? undefined : 56,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4,
                                overflow: 'hidden',
                                transition: 'opacity 0.15s',
                                zIndex: 10,
                                position: useAbsolute ? 'absolute' : 'relative',
                                top: useAbsolute ? 4 : 'auto',
                                left,
                                right,
                                width,
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                            >
                              <div style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>
                                Dr(a). {apt.doctor?.persona?.primer_nombre} {apt.doctor?.persona?.primer_apellido}
                              </div>
                              <div style={{
                                fontSize: 10, color: 'rgba(255,255,255,0.9)',
                                display: 'flex', alignItems: 'center', gap: 4,
                              }}>
                                <Clock size={10} />
                                {apt.fecha_inicio.substring(11, 16)} ({durationHours}h)
                              </div>
                              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)' }}>
                                {apt.motivo || apt.tipo_cita || 'General'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        <div style={{
          marginTop: 24, padding: 16,
          background: '#F8F9FA', borderRadius: 8,
          display: 'flex', gap: 16, flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#888F94', textTransform: 'uppercase' }}>
            Leyenda:
          </span>
          {Object.entries(statusColorMap).map(([status, color]) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
              <StatusBadge status={status as any} />
            </div>
          ))}
        </div>
      </div>

      {selectedAppointment && (
        <AppointmentQuickView
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
    </div>
  );
}
