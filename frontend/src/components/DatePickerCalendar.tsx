import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, AlertCircle } from 'lucide-react';
import { FieldBadge } from '../context';

interface DatePickerCalendarProps {
  value?: string;
  onChange: (date: string) => void;
  label?: string;
  badge?: 'required' | 'optional' | 'conditional';
  error?: string;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateString: string): string {
  if (!dateString) return '';
  // Support both YYYY-MM-DD and full ISO strings by splitting at T
  const cleanDateString = dateString.split('T')[0];
  const date = new Date(cleanDateString + 'T00:00:00');
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} de ${month} de ${year}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function DatePickerCalendar({ value, onChange, label, badge, error }: DatePickerCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const cleanDateString = value.split('T')[0];
      const d = new Date(cleanDateString + 'T00:00:00');
      return { year: d.getFullYear(), month: d.getMonth() };
    }
    return { year: new Date().getFullYear(), month: new Date().getMonth() };
  });

  const calendarRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrevMonth = () => {
    setViewDate((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setViewDate((prev) => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(viewDate.year, viewDate.month, day);
    onChange(formatDate(selectedDate));
    setIsOpen(false);
  };

  const daysInMonth = getDaysInMonth(viewDate.year, viewDate.month);
  const firstDay = getFirstDayOfMonth(viewDate.year, viewDate.month);
  const today = new Date();
  const todayStr = formatDate(today);

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const cleanValue = value ? value.split('T')[0] : undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }} ref={calendarRef}>
      {(label || badge) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {label && <label style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>{label}</label>}
          {badge && <FieldBadge type={badge} />}
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: `1px solid ${error ? '#E24B4A' : isOpen ? '#0BC5DF' : '#D3D7DA'}`,
            borderRadius: 8,
            background: '#fff',
            padding: '10px 12px',
            fontSize: 14,
            color: cleanValue ? '#203F49' : '#888F94',
            cursor: 'pointer',
            outline: 'none',
            textAlign: 'left',
            transition: 'border-color 0.15s',
            boxShadow: isOpen ? '0 0 0 3px rgba(11,197,223,0.12)' : 'none',
          }}
        >
          <Calendar size={15} style={{ color: '#888F94', flexShrink: 0 }} />
          <span style={{ flex: 1 }}>
            {cleanValue ? formatDisplayDate(cleanValue) : 'Selecciona una fecha'}
          </span>
        </button>

        {isOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 8,
            background: '#fff',
            border: '1px solid #D3D7DA',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 100,
            minWidth: 320,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: '1px solid #F1F3F4',
            }}>
              <button
                type="button"
                onClick={handlePrevMonth}
                style={{
                  background: '#F8F9FA',
                  border: '1px solid #D3D7DA',
                  borderRadius: 6,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#203F49',
                }}
              >
                <ChevronLeft size={16} />
              </button>

              <div style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#203F49',
              }}>
                {MONTHS[viewDate.month]} {viewDate.year}
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                style={{
                  background: '#F8F9FA',
                  border: '1px solid #D3D7DA',
                  borderRadius: 6,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#203F49',
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 4,
              marginBottom: 8,
            }}>
              {DAYS.map((day) => (
                <div
                  key={day}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#888F94',
                    textAlign: 'center',
                    padding: '4px 0',
                    textTransform: 'uppercase',
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 4,
            }}>
              {days.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} />;
                }

                const dateStr = formatDate(new Date(viewDate.year, viewDate.month, day));
                const isSelected = cleanValue === dateStr;
                const isToday = todayStr === dateStr;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDateSelect(day)}
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      border: isToday ? '2px solid #0BC5DF' : 'none',
                      borderRadius: 8,
                      background: isSelected ? '#0BC5DF' : 'transparent',
                      color: isSelected ? '#fff' : isToday ? '#0BC5DF' : '#203F49',
                      fontSize: 13,
                      fontWeight: isSelected || isToday ? 600 : 400,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = '#E6F8FB';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid #F1F3F4',
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  setViewDate({ year: today.getFullYear(), month: today.getMonth() });
                  onChange(formatDate(today));
                  setIsOpen(false);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#0BC5DF',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
              >
                Hoy
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <span style={{
          fontSize: 11,
          color: '#E24B4A',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <AlertCircle size={12} />
          {error}
        </span>
      )}
    </div>
  );
}
