import { useMemo, useRef, useState, useEffect } from 'react';
import { CalendarCard } from './CalendarCard';
import type { Appointment } from '../types';
import {
  getMinutesFromStart,
  getDurationMinutes,
  formatDateISO,
  formatDayLabel,
} from '../utils';
import {
  CALENDAR_START_HOUR,
  CALENDAR_END_HOUR,
  PX_PER_HOUR,
  VISIBLE_HOURS,
  COLORS,
} from '../constants';

// ─── Track assignment ────────────────────────────────────────────────────────

interface PlacedAppointment extends Appointment {
  track: number;
  totalTracks: number;
}

interface TrackResult {
  placed: PlacedAppointment[];
  hiddenCount: number;
  hiddenAppointments: Appointment[];
}

function assignTracks(appointments: Appointment[]): TrackResult {
  if (appointments.length === 0) return { placed: [], hiddenCount: 0, hiddenAppointments: [] };

  const sorted = [...appointments].sort(
    (a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime()
  );

  const MAX_TRACKS = 10; // Limitar a 10 tracks visibles
  const tracks: { end: number }[] = [];
  const placed: (PlacedAppointment & { track: number })[] = [];
  const hidden: Appointment[] = [];

  for (const apt of sorted) {
    const start = new Date(apt.fecha_inicio).getTime();
    const end = apt.fecha_fin
      ? new Date(apt.fecha_fin).getTime()
      : start + 3_600_000; // default 1h

    let assigned = false;
    for (let i = 0; i < tracks.length && i < MAX_TRACKS; i++) {
      if (start >= tracks[i].end) {
        tracks[i].end = end;
        placed.push({ ...apt, track: i, totalTracks: 0 });
        assigned = true;
        break;
      }
    }
    if (!assigned && tracks.length < MAX_TRACKS) {
      tracks.push({ end });
      placed.push({ ...apt, track: tracks.length - 1, totalTracks: 0 });
    } else if (!assigned) {
      hidden.push(apt);
    }
  }

  const maxTrack = tracks.length > 0 ? tracks.length : 1;
  const hiddenCount = hidden.length;
  return {
    placed: placed.map((p) => ({ ...p, totalTracks: maxTrack })),
    hiddenCount,
    hiddenAppointments: hidden,
  };
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Height in pixels of the sticky day-header row */
const HEADER_HEIGHT = 56;

/** Width of the time-gutter (hour labels column) */
const GUTTER_WIDTH = 60;

/** Total scrollable height of the time body */
const BODY_HEIGHT = VISIBLE_HOURS * PX_PER_HOUR;

// ─── Props ───────────────────────────────────────────────────────────────────

interface CalendarGridProps {
  displayDates: Date[];
  appointments: Appointment[];
  onSelectAppointment: (apt: Appointment) => void;
  onShowHiddenAppointments?: (date: Date, hiddenAppointments: Appointment[]) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CalendarGrid({
  displayDates,
  appointments,
  onSelectAppointment,
  onShowHiddenAppointments,
}: CalendarGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const hours = useMemo(
    () => Array.from({ length: VISIBLE_HOURS }, (_, i) => CALENDAR_START_HOUR + i),
    []
  );

  const todayStr = formatDateISO(new Date());

  const getDayAppointments = (date: Date): Appointment[] => {
    const dateStr = formatDateISO(date);
    return appointments.filter((apt) => apt.fecha_inicio.startsWith(dateStr));
  };

  const PX_PER_MIN = PX_PER_HOUR / 60;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'hidden',
        minHeight: 0,
      }}
    >
      {/* ── Sticky header row ── */}
      <div
        style={{
          display: 'flex',
          flexShrink: 0,
          borderBottom: '1px solid #D3D7DA',
          background: COLORS.white,
          zIndex: 10,
        }}
      >
        {/* Gutter placeholder */}
        <div
          style={{
            width: GUTTER_WIDTH,
            minWidth: GUTTER_WIDTH,
            flexShrink: 0,
            borderRight: '1px solid #D3D7DA',
            height: HEADER_HEIGHT,
          }}
        />

        {/* Day headers */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {displayDates.map((date, idx) => {
            const dateStr = formatDateISO(date);
            const isToday = dateStr === todayStr;
            return (
              <div
                key={idx}
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: HEADER_HEIGHT,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isToday ? COLORS.todayBg : COLORS.headerBg,
                  borderLeft: idx > 0 ? '1px solid #D3D7DA' : 'none',
                  padding: '6px 4px',
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: COLORS.muted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {formatDayLabel(date)}
                </span>
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: isToday ? COLORS.primary : COLORS.text,
                    lineHeight: 1.2,
                    marginTop: 2,
                  }}
                >
                  {date.getDate()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Scrollable time body ── */}
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          flex: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          minHeight: 0,
        }}
      >
        {/* ── Time gutter ── */}
        <div
          style={{
            width: GUTTER_WIDTH,
            minWidth: GUTTER_WIDTH,
            flexShrink: 0,
            position: 'relative',
            height: BODY_HEIGHT,
            borderRight: '1px solid #D3D7DA',
            background: COLORS.white,
          }}
        >
          {hours.map((hour) => (
            <div
              key={hour}
              style={{
                position: 'absolute',
                top: (hour - CALENDAR_START_HOUR) * PX_PER_HOUR,
                left: 0,
                right: 0,
                height: PX_PER_HOUR,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: 4,
                boxSizing: 'border-box',
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: COLORS.muted,
                  fontWeight: 500,
                  userSelect: 'none',
                  lineHeight: 1,
                }}
              >
                {(() => {
                  const h = hour % 12 || 12;
                  const ampm = hour < 12 ? 'AM' : 'PM';
                  return `${h}:00 ${ampm}`;
                })()}
              </span>
            </div>
          ))}
        </div>

        {/* ── Day columns ── */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            position: 'relative',
            minWidth: displayDates.length > 1
              ? Math.min(displayDates.length * 120, windowWidth - 100)
              : Math.min(200, windowWidth - 100),
          }}
        >
          {displayDates.map((date, colIdx) => {
            const dayAppts = getDayAppointments(date);
            const { placed, hiddenCount, hiddenAppointments } = assignTracks(dayAppts);

            return (
              <div
                key={colIdx}
                style={{
                  flex: 1,
                  minWidth: 0,
                  position: 'relative',
                  height: BODY_HEIGHT,
                  borderLeft: colIdx > 0 ? '1px solid #D3D7DA' : 'none',
                  background: COLORS.background,
                }}
              >
                {/* ── Hour grid lines (same absolute coordinate system) ── */}
                {hours.map((hour, idx) => (
                  <div
                    key={hour}
                    style={{
                      position: 'absolute',
                      top: (hour - CALENDAR_START_HOUR) * PX_PER_HOUR,
                      left: 0,
                      right: 0,
                      height: PX_PER_HOUR,
                      borderBottom: idx < hours.length - 1 ? '1px solid #EAECEE' : 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    {/* Half-hour tick */}
                    <div
                      style={{
                        position: 'absolute',
                        top: PX_PER_HOUR / 2,
                        left: 0,
                        right: 0,
                        borderBottom: '1px dashed #F1F3F4',
                      }}
                    />
                  </div>
                ))}

                {/* ── Appointment blocks ── */}
                {placed.map((apt) => {
                  const minutesFromStart = Math.max(
                    0,
                    getMinutesFromStart(apt.fecha_inicio, CALENDAR_START_HOUR)
                  );
                  const durationMinutes = Math.min(
                    getDurationMinutes(apt),
                    // clamp to end of visible range
                    (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60 - minutesFromStart
                  );

                  const trackWidth = 100 / apt.totalTracks;

                  return (
                    <CalendarCard
                      key={apt.id_cita}
                      appointment={apt}
                      onClick={() => onSelectAppointment(apt)}
                      style={{
                        position: 'absolute',
                        top: minutesFromStart * PX_PER_MIN,
                        height: Math.max(durationMinutes * PX_PER_MIN, 24),
                        left: `${apt.track * trackWidth + 0.5}%`,
                        width: `calc(${trackWidth}% - 2px)`,
                      }}
                    />
                  );
                })}

                {/* ── Hidden appointments indicator ── */}
                {hiddenCount > 0 && (
                  <div
                    onClick={() => onShowHiddenAppointments?.(date, hiddenAppointments)}
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      background: COLORS.primary,
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: 4,
                      zIndex: 20,
                      cursor: 'pointer',
                    }}
                  >
                    +{hiddenCount} más
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
