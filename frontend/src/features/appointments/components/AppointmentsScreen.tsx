import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Select, Alert, StatusBadge } from '../../../context';
import { Spinner } from '../../../components';
import { AppointmentQuickView } from './AppointmentQuickView';
import { CalendarGrid } from './CalendarGrid';
import { appointmentService } from '../services/appointmentService';
import type { Appointment, UsuarioRecord } from '../types';
import { useNavigate } from 'react-router-dom';
import { formatMonthYear, formatDateISO, getWeekDays } from '../utils';
import { STATUS_COLORS, COLORS, VIEW_OPTIONS } from '../constants';

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
      const start = formatDateISO(dates[0]);
      const end = formatDateISO(dates[dates.length - 1]);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%', overflowY: 'auto' }}>
      {selectedDoctor !== 'all' && (
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
              : `${currentDate.getDate()} de ${formatMonthYear(currentDate)}`}
          </h4>
        </div>

        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Spinner />
          </div>
        ) : (
          <CalendarGrid
            displayDates={displayDates}
            appointments={appointments}
            columnWidth={viewType === 'week' ? '120px' : '300px'}
            onSelectAppointment={setSelectedAppointment}
          />
        )}

        <div style={{
          marginTop: 24, padding: 16, background: COLORS.headerBg, borderRadius: 8,
          display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted, textTransform: 'uppercase' }}>
            Leyenda:
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
