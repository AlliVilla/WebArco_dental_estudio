import { Clock } from 'lucide-react';
import type { Appointment } from '../types';
import { getDurationHours } from '../utils';
import { STATUS_COLORS, COLORS } from '../constants';

interface CalendarCardProps {
  appointment: Appointment;
  style: React.CSSProperties;
  onClick: () => void;
}

export function CalendarCard({ appointment, onClick, style }: CalendarCardProps) {
  const bg = STATUS_COLORS[appointment.estado] || COLORS.primary;
  const hours = getDurationHours(appointment);

  return (
    <div
      onClick={onClick}
      style={{
        ...style,
        background: bg,
        borderRadius: 6,
        padding: 8,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        overflow: 'hidden',
        zIndex: 10,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>
        Dr(a). {appointment.doctor?.persona?.primer_nombre} {appointment.doctor?.persona?.primer_apellido}
      </div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: 4 }}>
        <Clock size={10} />
        {appointment.fecha_inicio.substring(11, 16)} ({hours}h)
      </div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)' }}>
        {appointment.motivo || appointment.tipo_cita || 'General'}
      </div>
    </div>
  );
}
