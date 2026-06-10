import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { COLORS } from '../constants';
import type { Appointment } from '../types';
import { formatDateISO } from '../utils';

interface CalendarMonthProps {
  currentDate: Date;
  appointments: Appointment[];
  onDateClick: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export function CalendarMonth({ currentDate, appointments, onDateClick, onPrevMonth, onNextMonth }: CalendarMonthProps) {
  const monthData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const totalDays = lastDay.getDate();
    
    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];
    
    // Add days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }
    
    // Add days from current month
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }
    
    // Add days from next month
    const remainingDays = 42 - days.length; // 6 rows x 7 days = 42
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }
    
    return { days, monthName: firstDay.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) };
  }, [currentDate]);

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = formatDateISO(date);
    return appointments.filter((apt) => apt.fecha_inicio.startsWith(dateStr));
  };

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        background: COLORS.white,
        borderBottom: '1px solid #D3D7DA',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onPrevMonth}
            style={{
              background: 'none',
              border: '1px solid #D3D7DA',
              borderRadius: 6,
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronLeft size={18} color={COLORS.text} />
          </button>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: COLORS.text }}>
            {monthData.monthName.charAt(0).toUpperCase() + monthData.monthName.slice(1)}
          </h2>
          <button
            onClick={onNextMonth}
            style={{
              background: 'none',
              border: '1px solid #D3D7DA',
              borderRadius: 6,
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronRight size={18} color={COLORS.text} />
          </button>
        </div>
      </div>

      {/* Week day headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        padding: '8px 20px',
        background: COLORS.headerBg,
        borderBottom: '1px solid #D3D7DA',
      }}>
        {weekDays.map((day) => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              fontSize: 11,
              fontWeight: 600,
              color: COLORS.muted,
              textTransform: 'uppercase',
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        flex: 1,
        padding: '8px',
        gap: 4,
      }}>
        {monthData.days.map(({ date, isCurrentMonth }, idx) => {
          const dayAppointments = getAppointmentsForDate(date);
          const isToday = formatDateISO(date) === formatDateISO(new Date());
          
          return (
            <div
              key={idx}
              onClick={() => onDateClick(date)}
              style={{
                background: isToday ? COLORS.todayBg : COLORS.white,
                border: isToday ? `1px solid ${COLORS.primary}` : '1px solid #D3D7DA',
                borderRadius: 6,
                padding: '8px',
                cursor: 'pointer',
                minHeight: 80,
                opacity: isCurrentMonth ? 1 : 0.4,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (isCurrentMonth) {
                  e.currentTarget.style.background = COLORS.todayBg;
                }
              }}
              onMouseLeave={(e) => {
                if (!isToday) {
                  e.currentTarget.style.background = COLORS.white;
                }
              }}
            >
              <div style={{
                fontSize: 14,
                fontWeight: isToday ? 600 : 400,
                color: isToday ? COLORS.primary : COLORS.text,
                marginBottom: 4,
              }}>
                {date.getDate()}
              </div>
              
              {dayAppointments.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {dayAppointments.slice(0, 3).map((apt) => (
                    <div
                      key={apt.id_cita}
                      style={{
                        fontSize: 9,
                        padding: '2px 4px',
                        borderRadius: 2,
                        background: COLORS.primary,
                        color: '#fff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {apt.fecha_inicio.substring(11, 16)} {apt.doctor?.persona?.primer_nombre}
                    </div>
                  ))}
                  {dayAppointments.length > 3 && (
                    <div style={{
                      fontSize: 8,
                      color: COLORS.muted,
                      fontWeight: 500,
                    }}>
                      +{dayAppointments.length - 3} más
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
