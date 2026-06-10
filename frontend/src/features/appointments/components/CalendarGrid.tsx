import { useMemo } from 'react';
import { CalendarCard } from './CalendarCard';
import type { Appointment } from '../types';
import { getMinutesFromStart, getDurationMinutes, formatDateISO, formatDayLabel } from '../utils';
import { CALENDAR_START_HOUR, PX_PER_HOUR, VISIBLE_HOURS, COLORS } from '../constants';

interface PlacedAppointment extends Appointment {
  track: number;
}

function assignTracks(appointments: Appointment[]): PlacedAppointment[] {
  if (appointments.length === 0) return [];

  const sorted = [...appointments].sort((a, b) =>
    new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime()
  );

  const tracks: { end: number }[] = [];
  const placed: PlacedAppointment[] = [];

  for (const apt of sorted) {
    const start = new Date(apt.fecha_inicio).getTime();
    const end = apt.fecha_fin
      ? new Date(apt.fecha_fin).getTime()
      : start + 3600000;

    let assigned = false;
    for (let i = 0; i < tracks.length; i++) {
      if (start >= tracks[i].end) {
        tracks[i].end = end;
        placed.push({ ...apt, track: i });
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      tracks.push({ end });
      placed.push({ ...apt, track: tracks.length - 1 });
    }
  }

  return placed;
}

interface CalendarGridProps {
  displayDates: Date[];
  appointments: Appointment[];
  columnWidth: string;
  onSelectAppointment: (apt: Appointment) => void;
}

export function CalendarGrid({ displayDates, appointments, columnWidth, onSelectAppointment }: CalendarGridProps) {
  const hours = useMemo(
    () => Array.from({ length: VISIBLE_HOURS }, (_, i) => CALENDAR_START_HOUR + i),
    []
  );

  const todayStr = formatDateISO(new Date());

  const getDayAppointments = (date: Date): Appointment[] => {
    const dateStr = formatDateISO(date);
    return appointments.filter((apt) => apt.fecha_inicio.startsWith(dateStr));
  };

  return (
    <div style={{ overflowX: 'auto', flex: 1, minHeight: 400 }}>
      <div style={{ display: 'flex', minWidth: displayDates.length > 1 ? 900 : 400 }}>
        <div style={{
          width: 80, flexShrink: 0, position: 'sticky', left: 0, background: COLORS.white, zIndex: 2,
        }}>
          {hours.map((hour) => (
            <div key={hour} style={{
              height: PX_PER_HOUR,
              display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
              padding: '8px 12px', fontSize: 12, color: COLORS.muted,
            }}>
              {`${hour.toString().padStart(2, '0')}:00`}
            </div>
          ))}
        </div>

        {displayDates.map((date, idx) => {
          const dateStr = formatDateISO(date);
          const isToday = dateStr === todayStr;
          const dayAppts = getDayAppointments(date);
          const placed = assignTracks(dayAppts);
          const totalTracks = placed.length > 0 ? Math.max(...placed.map((p) => p.track)) + 1 : 1;

          return (
            <div key={idx} style={{
              flex: 1, minWidth: columnWidth,
              borderLeft: '1px solid #F1F3F4',
            }}>
              <div style={{
                padding: '8px 12px', textAlign: 'center',
                background: isToday ? COLORS.todayBg : COLORS.headerBg,
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.muted, textTransform: 'uppercase' }}>
                  {formatDayLabel(date)}
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, marginTop: 2 }}>
                  {date.getDate()}
                </div>
              </div>

              <div style={{
                position: 'relative',
                height: VISIBLE_HOURS * PX_PER_HOUR,
                background: COLORS.background,
              }}>
                {hours.map((hour) => (
                  <div key={hour} style={{
                    position: 'absolute', top: (hour - CALENDAR_START_HOUR) * PX_PER_HOUR,
                    height: PX_PER_HOUR, left: 0, right: 0,
                    borderTop: '1px solid #F1F3F4',
                  }} />
                ))}

                {placed.map((apt) => {
                  const minutesFromStart = Math.max(0, getMinutesFromStart(apt.fecha_inicio, CALENDAR_START_HOUR));
                  const durationMinutes = getDurationMinutes(apt);
                  const trackWidth = 100 / totalTracks;

                  return (
                    <CalendarCard
                      key={apt.id_cita}
                      appointment={apt}
                      onClick={() => onSelectAppointment(apt)}
                      style={{
                        position: 'absolute',
                        top: minutesFromStart,
                        height: durationMinutes,
                        left: `${apt.track * trackWidth + 0.5}%`,
                        width: `calc(${trackWidth}% - 1px)`,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
