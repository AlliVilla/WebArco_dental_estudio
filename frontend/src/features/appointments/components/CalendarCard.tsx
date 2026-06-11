import { Clock } from 'lucide-react';
import type { Appointment } from '../types';
import { getDurationHours } from '../utils';
import { STATUS_STYLES, COLORS } from '../constants';

interface CalendarCardProps {
  appointment: Appointment;
  style: React.CSSProperties;
  onClick: () => void;
}

export function CalendarCard({ appointment, onClick, style }: CalendarCardProps) {
  const hours = getDurationHours(appointment);
  const styleConfig = STATUS_STYLES[appointment.estado] ?? {
    bg: COLORS.primary,
    border: 'rgba(255,255,255,0.2)',
    text: '#fff',
    label: appointment.estado,
  };

  // Infer pixel height from the style prop to conditionally render content
  const heightPx =
    typeof style?.height === 'number'
      ? style.height
      : typeof style?.height === 'string'
      ? parseFloat(style.height)
      : 60;

  const isCompact = heightPx < 50;
  const isMedium = heightPx >= 50 && heightPx < 90;

  const patientName = appointment.persona
    ? `${appointment.persona.primer_nombre} ${appointment.persona.primer_apellido}`
    : '—';

  const doctorName = appointment.doctor?.persona
    ? `Dr. ${appointment.doctor.persona.primer_nombre} ${appointment.doctor.persona.primer_apellido}`
    : null;

  const startTime = appointment.fecha_inicio.substring(11, 16);
  const endTime = appointment.fecha_fin
    ? appointment.fecha_fin.substring(11, 16)
    : null;

  return (
    <div
      onClick={onClick}
      title={`${patientName} — ${startTime}${endTime ? `–${endTime}` : ''} (${hours}h)`}
      style={{
        ...style,
        background: styleConfig.bg,
        borderRadius: 4,
        padding: isCompact ? '2px 5px' : '5px 7px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: isCompact ? 1 : 3,
        overflow: 'hidden',
        zIndex: 10,
        boxSizing: 'border-box',
        border: `1px solid ${styleConfig.border}`,
        transition: 'filter 0.12s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.filter = 'brightness(0.92)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.filter = 'none';
      }}
    >
      {/* Patient name — always visible */}
      <div
        style={{
          fontSize: isCompact ? 9 : 11,
          fontWeight: 700,
          color: styleConfig.text,
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {patientName}
      </div>

      {/* Time range */}
      {!isCompact && (
        <div
          style={{
            fontSize: 9,
            color: styleConfig.text,
            opacity: 0.9,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            lineHeight: 1.1,
          }}
        >
          <Clock size={8} />
          {startTime}
          {endTime ? `–${endTime}` : ` (${hours}h)`}
        </div>
      )}

      {/* Doctor + motivo — only when there's enough vertical space */}
      {!isCompact && !isMedium && doctorName && (
        <div
          style={{
            fontSize: 9,
            color: styleConfig.text,
            opacity: 0.8,
            lineHeight: 1.1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {doctorName}
        </div>
      )}

      {!isCompact && !isMedium && (appointment.motivo || appointment.tipo_cita) && (
        <div
          style={{
            fontSize: 9,
            color: styleConfig.text,
            opacity: 0.75,
            lineHeight: 1.1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {appointment.motivo || appointment.tipo_cita}
        </div>
      )}
    </div>
  );
}
