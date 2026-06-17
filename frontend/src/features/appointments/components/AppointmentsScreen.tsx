import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Select, Alert, StatusBadge } from '../../../context';
import { Spinner } from '../../../components';
import { AppointmentQuickView } from './AppointmentQuickView';
import { CalendarGrid } from './CalendarGrid';
import { CalendarMonth } from './CalendarMonth';
import { appointmentService } from '../services/appointmentService';
import type { Appointment, UsuarioRecord } from '../types';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { formatMonthYear, formatDateISO, getWeekDays } from '../utils';
import { STATUS_COLORS, COLORS, VIEW_OPTIONS, STATUS_STYLES } from '../constants';

export function AppointmentsScreen() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const hasGlobalAccess = user?.privilegios?.includes(69) ?? false;
  
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDoctor, setSelectedDoctor] = useState('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [hiddenAppointmentsModal, setHiddenAppointmentsModal] = useState<{ date: Date; appointments: Appointment[] } | null>(null);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let start: string;
      let end: string;

      if (viewType === 'month') {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        start = formatDateISO(firstDay);
        end = formatDateISO(lastDay);
      } else {
        const weekDays = getWeekDays(currentDate);
        const dates = viewType === 'week' ? weekDays : [currentDate];
        start = formatDateISO(dates[0]);
        end = formatDateISO(dates[dates.length - 1]);
      }

      const doctorId = selectedDoctor !== 'all' ? Number(selectedDoctor) : undefined;
      const res = await appointmentService.getByCalendar(start, end, doctorId);
      if (res.success) {
        setAppointments(res.data);
      } else {
        setError(res.message);
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'statusCode' in err && (err as any).statusCode === 403) {
        setLoading(false);
        navigate('/dashboard', { state: { noPermission: true, section: 'agenda' }, replace: true });
        return;
      }
      setError((err && typeof err === 'object' && 'message' in err) ? (err as any).message : 'Error al cargar citas');
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
    newDate.setDate(currentDate.getDate() + (viewType === 'week' ? -7 : -1));
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (viewType === 'week' ? 7 : 1));
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const res = await appointmentService.getUsuarios();
        if (res.success && res.data) {
          const mapped = res.data.map((u: UsuarioRecord) => ({
            value: String(u.id_usuario),
            label: `Dr(a). ${u.persona.primer_nombre} ${u.persona.primer_apellido}`.trim(),
          }));
          setDoctors([{ value: 'all', label: 'Todos los doctores' }, ...mapped]);
        }
      } catch { /* fallback */ }
    };
    loadDoctors();
  }, []);

  const selectedDoctorName = doctors.find((d) => d.value === selectedDoctor)?.label || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%', minHeight: 0, overflowY: 'auto' }}>
      {hasGlobalAccess && selectedDoctor !== 'all' && (
        <Alert
          variant="info"
          message={`Estás viendo la agenda del ${selectedDoctorName}. Cambia el selector para ver otro doctor.`}
        />
      )}

      {error && <Alert variant="error" message={error} onClose={() => setError('')} />}

      {!loading && appointments.length === 0 && !error && (
        <Alert variant="info" message="No hay citas programadas para este periodo." />
      )}

      <div style={{
        background: COLORS.white, border: `0.5px solid ${COLORS.border}`,
        borderRadius: 12, padding: 24, flex: 1, display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 24, flexWrap: 'wrap', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Calendar size={20} style={{ color: COLORS.primary }} />
            <h3 style={{ margin: 0, color: COLORS.text, fontSize: 18 }}>Calendario de Citas</h3>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 160 }}>
              <Select
                label="Vista"
                badge="required"
                options={VIEW_OPTIONS}
                value={viewType}
                onChange={(v) => setViewType(v as 'day' | 'week')}
              />
            </div>

            {hasGlobalAccess && (
              <div style={{ minWidth: 200 }}>
                <Select
                  label="Doctor"
                  badge="conditional"
                  options={doctors.length > 0 ? doctors : [{ value: 'all', label: 'Cargando...' }]}
                  value={selectedDoctor}
                  onChange={(v) => setSelectedDoctor(v.toString())}
                />
              </div>
            )}

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
          marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${COLORS.borderLight}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={goToPrevious} style={{
              background: COLORS.white, border: `1px solid ${COLORS.border}`,
              borderRadius: 6, padding: 8, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ChevronLeft size={16} style={{ color: COLORS.text }} />
            </button>
            <button onClick={goToNext} style={{
              background: COLORS.white, border: `1px solid ${COLORS.border}`,
              borderRadius: 6, padding: 8, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ChevronRight size={16} style={{ color: COLORS.text }} />
            </button>
            <Button variant="secondary" size="sm" onClick={goToToday}>
              Hoy
            </Button>
          </div>

          <h4 style={{ margin: 0, color: COLORS.text, fontSize: 16 }}>
            {viewType === 'week'
              ? formatMonthYear(currentDate)
              : viewType === 'month'
              ? formatMonthYear(currentDate)
              : `${currentDate.getDate()} de ${formatMonthYear(currentDate)}`}
          </h4>
        </div>

        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
            <Spinner />
          </div>
        ) : viewType === 'month' ? (
          <div style={{ flex: 1, minHeight: 480, display: 'flex', flexDirection: 'column' }}>
            <CalendarMonth
              currentDate={currentDate}
              appointments={appointments}
              onDateClick={(date) => {
                setCurrentDate(date);
                setViewType('day');
              }}
              onPrevMonth={() => {
                const newDate = new Date(currentDate);
                newDate.setMonth(newDate.getMonth() - 1);
                setCurrentDate(newDate);
              }}
              onNextMonth={() => {
                const newDate = new Date(currentDate);
                newDate.setMonth(newDate.getMonth() + 1);
                setCurrentDate(newDate);
              }}
            />
          </div>
        ) : (
          <div style={{ flex: 1, minHeight: 480, display: 'flex', flexDirection: 'column' }}>
            <CalendarGrid
              displayDates={displayDates}
              appointments={appointments}
              onSelectAppointment={setSelectedAppointment}
              onShowHiddenAppointments={(date, hiddenApps) => {
                setHiddenAppointmentsModal({ date, appointments: hiddenApps });
              }}
            />
          </div>
        )}

        {/* Hidden appointments modal */}
        {hiddenAppointmentsModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setHiddenAppointmentsModal(null)}
          >
            <div
              style={{
                background: COLORS.white,
                borderRadius: 8,
                padding: 24,
                maxWidth: 500,
                width: '90%',
                maxHeight: '80vh',
                overflow: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: COLORS.text }}>
                  Citas ocultas - {hiddenAppointmentsModal.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
                <button
                  onClick={() => setHiddenAppointmentsModal(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 20,
                    cursor: 'pointer',
                    color: COLORS.muted,
                  }}
                >
                  ×
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {hiddenAppointmentsModal.appointments.map((apt) => {
                  const styleConfig = STATUS_STYLES[apt.estado] ?? {
                    bg: COLORS.primary,
                    border: 'rgba(255,255,255,0.2)',
                    text: '#fff',
                    label: apt.estado,
                  };

                  const patientName = apt.persona
                    ? `${apt.persona.primer_nombre} ${apt.persona.primer_apellido}`
                    : '—';

                  const doctorName = apt.doctor?.persona
                    ? `Dr. ${apt.doctor.persona.primer_nombre} ${apt.doctor.persona.primer_apellido}`
                    : null;

                  const startTime = new Date(apt.fecha_inicio).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                  const endTime = apt.fecha_fin
                    ? new Date(apt.fecha_fin).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                    : null;

                  return (
                    <div
                      key={apt.id_cita}
                      onClick={() => {
                        setSelectedAppointment(apt);
                        setHiddenAppointmentsModal(null);
                      }}
                      style={{
                        padding: 12,
                        border: `1px solid ${styleConfig.border}`,
                        borderRadius: 6,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: styleConfig.bg,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.filter = 'brightness(0.92)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.filter = 'none';
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 600, color: styleConfig.text, marginBottom: 4 }}>
                        {startTime}{endTime ? `–${endTime}` : ''} - {doctorName}
                      </div>
                      <div style={{ fontSize: 12, color: styleConfig.text, opacity: 0.9 }}>
                        {patientName}
                      </div>
                      <div style={{ fontSize: 12, color: styleConfig.text, opacity: 0.8 }}>
                        {apt.motivo}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div style={{
          marginTop: 24, padding: 16, background: COLORS.headerBg, borderRadius: 8,
          display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted, textTransform: 'uppercase' }}>
            Estados:
          </span>
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
              <StatusBadge status={status as Appointment['estado']} />
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
