import { useMemo, useRef } from "react";
import { Clock } from "lucide-react";
import { CalendarCard } from "./CalendarCard";
import type { Appointment } from "../types";
import {
  getMinutesFromStart,
  getDurationMinutes,
  formatDateISO,
  formatDayLabel,
  formatTimeFromISO,
} from "../utils";
import {
  CALENDAR_START_HOUR,
  CALENDAR_END_HOUR,
  PX_PER_HOUR,
  VISIBLE_HOURS,
  COLORS,
  STATUS_STYLES,
} from "../constants";
import { useResponsive } from "../../../hooks/useWindowWidth";

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
  if (appointments.length === 0)
    return { placed: [], hiddenCount: 0, hiddenAppointments: [] };

  const sorted = [...appointments].sort(
    (a, b) =>
      new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime()
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

  // Calcular totalTracks por cita según la cantidad de tracks activos
  // en su franja horaria, no el máximo del día entero.
  for (const p of placed) {
    const pStart = new Date(p.fecha_inicio).getTime();
    const pEnd = p.fecha_fin
      ? new Date(p.fecha_fin).getTime()
      : pStart + 3_600_000;

    const activeTracks = new Set<number>();
    activeTracks.add(p.track);

    for (const q of placed) {
      if (p.id_cita === q.id_cita) continue;
      const qStart = new Date(q.fecha_inicio).getTime();
      const qEnd = q.fecha_fin
        ? new Date(q.fecha_fin).getTime()
        : qStart + 3_600_000;

      if (pStart < qEnd && qStart < pEnd) {
        activeTracks.add(q.track);
      }
    }
    p.totalTracks = activeTracks.size;
  }

  return {
    placed,
    hiddenCount: hidden.length,
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
  onShowHiddenAppointments?: (
    date: Date,
    hiddenAppointments: Appointment[]
  ) => void;
}

// ─── Vista lista para móvil ────────────────────────────────────────────────────
// El grid de horas con columnas y tracks es ilegible en pantallas angostas
// (gutter de 60px deja muy poco espacio y el texto de 9px no se puede leer).
// En móvil mostramos una lista cronológica de citas, agrupada por día si hay
// más de una fecha visible (vista semana).

function MobileAppointmentList({
  displayDates,
  appointments,
  onSelectAppointment,
}: CalendarGridProps) {
  const todayStr = formatDateISO(new Date());

  const getDayAppointments = (date: Date): Appointment[] => {
    const dateStr = formatDateISO(date);
    return appointments
      .filter((apt) => apt.fecha_inicio.startsWith(dateStr))
      .sort(
        (a, b) =>
          new Date(a.fecha_inicio).getTime() -
          new Date(b.fecha_inicio).getTime()
      );
  };

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        paddingBottom: 8,
      }}
    >
      {displayDates.map((date, idx) => {
        const dayAppts = getDayAppointments(date);
        const dateStr = formatDateISO(date);
        const isToday = dateStr === todayStr;

        return (
          <div key={idx}>
            {displayDates.length > 1 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                  padding: "0 4px",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: isToday ? COLORS.primary : COLORS.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {formatDayLabel(date)} {date.getDate()}
                </span>
                {isToday && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      color: COLORS.primary,
                      background: COLORS.todayBg,
                      padding: "1px 6px",
                      borderRadius: 10,
                    }}
                  >
                    HOY
                  </span>
                )}
              </div>
            )}

            {dayAppts.length === 0 ? (
              <p
                style={{
                  fontSize: 13,
                  color: COLORS.muted,
                  padding: "8px 4px",
                  margin: 0,
                }}
              >
                Sin citas programadas.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {dayAppts.map((apt) => {
                  const styleConfig = STATUS_STYLES[apt.estado] ?? {
                    bg: COLORS.primary,
                    border: "rgba(255,255,255,0.2)",
                    text: "#fff",
                    label: apt.estado,
                  };
                  const patientName = apt.persona
                    ? `${apt.persona.primer_nombre} ${apt.persona.primer_apellido}`
                    : "—";
                  const doctorName = apt.doctor?.persona
                    ? `Dr. ${apt.doctor.persona.primer_nombre} ${apt.doctor.persona.primer_apellido}`
                    : null;
                  const startTime = formatTimeFromISO(apt.fecha_inicio);
                  const endTime = apt.fecha_fin
                    ? formatTimeFromISO(apt.fecha_fin)
                    : null;

                  return (
                    <button
                      key={apt.id_cita}
                      onClick={() => onSelectAppointment(apt)}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        textAlign: "left",
                        border: `1px solid ${styleConfig.border}`,
                        borderRadius: 10,
                        background: styleConfig.bg,
                        padding: 12,
                        cursor: "pointer",
                        width: "100%",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          minWidth: 56,
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: styleConfig.text,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Clock size={11} />
                          {startTime}
                        </span>
                        {endTime && (
                          <span
                            style={{
                              fontSize: 10,
                              color: styleConfig.text,
                              opacity: 0.75,
                            }}
                          >
                            –{endTime}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: styleConfig.text,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {patientName}
                        </span>
                        {doctorName && (
                          <span
                            style={{
                              fontSize: 11,
                              color: styleConfig.text,
                              opacity: 0.85,
                            }}
                          >
                            {doctorName}
                          </span>
                        )}
                        {(apt.motivo || apt.tipo_cita) && (
                          <span
                            style={{
                              fontSize: 11,
                              color: styleConfig.text,
                              opacity: 0.75,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {apt.motivo || apt.tipo_cita}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CalendarGrid({
  displayDates,
  appointments,
  onSelectAppointment,
  onShowHiddenAppointments,
}: CalendarGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useResponsive();

  const hours = useMemo(
    () =>
      Array.from({ length: VISIBLE_HOURS }, (_, i) => CALENDAR_START_HOUR + i),
    []
  );

  const todayStr = formatDateISO(new Date());

  const getDayAppointments = (date: Date): Appointment[] => {
    const dateStr = formatDateISO(date);
    return appointments.filter((apt) => apt.fecha_inicio.startsWith(dateStr));
  };

  const PX_PER_MIN = PX_PER_HOUR / 60;

  if (isMobile) {
    return (
      <MobileAppointmentList
        displayDates={displayDates}
        appointments={appointments}
        onSelectAppointment={onSelectAppointment}
      />
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        overflow: "hidden",
        minHeight: 0,
      }}
    >
      {/* ── Sticky header row ── */}
      <div
        style={{
          display: "flex",
          flexShrink: 0,
          borderBottom: "1px solid #D3D7DA",
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
            borderRight: "1px solid #D3D7DA",
            height: HEADER_HEIGHT,
          }}
        />

        {/* Day headers */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
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
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isToday ? COLORS.todayBg : COLORS.headerBg,
                  borderLeft: idx > 0 ? "1px solid #D3D7DA" : "none",
                  padding: "6px 4px",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: COLORS.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
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
          display: "flex",
          flex: 1,
          overflowY: "auto",
          overflowX: "auto",
          minHeight: 0,
        }}
      >
        {/* ── Time gutter ── */}
        <div
          style={{
            width: GUTTER_WIDTH,
            minWidth: GUTTER_WIDTH,
            flexShrink: 0,
            position: "relative",
            height: BODY_HEIGHT,
            borderRight: "1px solid #D3D7DA",
            background: COLORS.white,
          }}
        >
          {hours.map((hour) => (
            <div
              key={hour}
              style={{
                position: "absolute",
                top: (hour - CALENDAR_START_HOUR) * PX_PER_HOUR,
                left: 0,
                right: 0,
                height: PX_PER_HOUR,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                paddingTop: 4,
                boxSizing: "border-box",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: COLORS.muted,
                  fontWeight: 500,
                  userSelect: "none",
                  lineHeight: 1,
                }}
              >
                {(() => {
                  const h = hour % 12 || 12;
                  const ampm = hour < 12 ? "AM" : "PM";
                  return `${h}:00 ${ampm}`;
                })()}
              </span>
            </div>
          ))}
        </div>

        {/* ── Day columns ── */}
        <div
          style={{
            display: "flex",
            flex: 1,
            position: "relative",
            minWidth: displayDates.length > 1 ? displayDates.length * 120 : 200,
          }}
        >
          {displayDates.map((date, colIdx) => {
            const dayAppts = getDayAppointments(date);
            const { placed, hiddenCount, hiddenAppointments } =
              assignTracks(dayAppts);

            return (
              <div
                key={colIdx}
                style={{
                  flex: 1,
                  minWidth: 0,
                  position: "relative",
                  height: BODY_HEIGHT,
                  borderLeft: colIdx > 0 ? "1px solid #D3D7DA" : "none",
                  background: COLORS.background,
                }}
              >
                {/* ── Hour grid lines (same absolute coordinate system) ── */}
                {hours.map((hour, idx) => (
                  <div
                    key={hour}
                    style={{
                      position: "absolute",
                      top: (hour - CALENDAR_START_HOUR) * PX_PER_HOUR,
                      left: 0,
                      right: 0,
                      height: PX_PER_HOUR,
                      borderBottom:
                        idx < hours.length - 1 ? "1px solid #EAECEE" : "none",
                      boxSizing: "border-box",
                    }}
                  >
                    {/* Half-hour tick */}
                    <div
                      style={{
                        position: "absolute",
                        top: PX_PER_HOUR / 2,
                        left: 0,
                        right: 0,
                        borderBottom: "1px dashed #F1F3F4",
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
                    (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60 -
                      minutesFromStart
                  );

                  const trackWidth = 100 / apt.totalTracks;

                  return (
                    <CalendarCard
                      key={apt.id_cita}
                      appointment={apt}
                      onClick={() => onSelectAppointment(apt)}
                      style={{
                        position: "absolute",
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
                    onClick={() =>
                      onShowHiddenAppointments?.(date, hiddenAppointments)
                    }
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      background: COLORS.primary,
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "2px 6px",
                      borderRadius: 4,
                      zIndex: 20,
                      cursor: "pointer",
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
