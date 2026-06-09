import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { Button } from '../../../context';
import type { Appointment } from '../types';

const statusColors: Record<string, { bg: string; border: string; text: string; label: string }> = {
  programada: { bg: '#E6F8FB', border: '#B2EDF5', text: '#0BC5DF', label: 'Programada' },
  confirmada: { bg: '#F5F3FF', border: '#DDD6FE', text: '#8B5CF6', label: 'Confirmada' },
  atendida: { bg: '#ECFDF5', border: '#A7F3D0', text: '#10B981', label: 'Atendida' },
  cancelada: { bg: '#FEF2F2', border: '#FECACA', text: '#EF4444', label: 'Cancelada' },
  ausente: { bg: '#FFF7ED', border: '#FFEDD5', text: '#F97316', label: 'Ausente' },
  reprogramada: { bg: '#EFF6FF', border: '#BFDBFE', text: '#3B82F6', label: 'Reprogramada' },
};

export interface AppointmentQuickViewProps {
  appointment: Appointment;
  onClose: () => void;
}

export function AppointmentQuickView({ appointment, onClose }: AppointmentQuickViewProps) {
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate(`/agenda/${appointment.id_cita}/edit`);
    onClose();
  };

  const handleDetail = () => {
    navigate(`/agenda/${appointment.id_cita}`);
    onClose();
  };

  const statusStyle = statusColors[appointment.estado];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.4)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 12, padding: 24,
          maxWidth: 420, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column', gap: 16
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0, color: '#203F49', fontSize: 18, fontWeight: 500 }}>
            Detalle de Cita
          </h3>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'none', border: '1px solid #D3D7DA', borderRadius: 6,
              cursor: 'pointer', color: '#5F656A', display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, padding: 0
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <span style={{ fontSize: 13, color: '#888F94', display: 'block', marginBottom: 4 }}>
              Paciente
            </span>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#203F49' }}>
              {appointment.persona?.primer_nombre} {appointment.persona?.primer_apellido}
            </span>
          </div>

          <div>
            <span style={{ fontSize: 13, color: '#888F94', display: 'block', marginBottom: 4 }}>
              Doctor
            </span>
            <span style={{ fontSize: 15, color: '#203F49' }}>
              {appointment.doctor?.persona?.primer_nombre ? `Dra. ${appointment.doctor.persona.primer_nombre} ${appointment.doctor.persona.primer_apellido}` : 'Doctor no asignado'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <span style={{ fontSize: 13, color: '#888F94', display: 'block', marginBottom: 4 }}>
                Fecha
              </span>
              <span style={{ fontSize: 15, color: '#203F49' }}>
                {new Date(appointment.fecha_inicio).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div>
              <span style={{ fontSize: 13, color: '#888F94', display: 'block', marginBottom: 4 }}>
                Hora
              </span>
              <span style={{ fontSize: 15, color: '#203F49' }}>
                {appointment.fecha_inicio.substring(11, 16)} 
                {appointment.fecha_fin ? ` (${Math.max(1, Math.round((new Date(appointment.fecha_fin).getTime() - new Date(appointment.fecha_inicio).getTime()) / 3600000))}h)` : ' (1h)'}
              </span>
            </div>
          </div>

          <div>
            <span style={{ fontSize: 13, color: '#888F94', display: 'block', marginBottom: 4 }}>
              Tratamiento
            </span>
            <span style={{ fontSize: 15, color: '#203F49' }}>
              {appointment.motivo || appointment.tipo_cita || 'General'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: 13, color: '#888F94', display: 'block', marginBottom: 4 }}>
              Estado
            </span>
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              padding: '4px 12px',
              borderRadius: 20,
              background: statusStyle?.bg || '#E6F8FB',
              color: statusStyle?.text || '#0BC5DF',
              display: 'inline-block'
            }}>
              {statusStyle?.label || appointment.estado}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          <Button variant="primary" fullWidth onClick={handleDetail} style={{ padding: '12px 0', fontSize: 15, fontWeight: 500 }}>
            Ver detalle completo
          </Button>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Button variant="ghost" fullWidth onClick={() => {
              navigate(`/agenda/${appointment.id_cita}/history`);
              onClose();
            }} style={{ color: '#0BC5DF', fontWeight: 500 }}>
              Historial del paciente
            </Button>
            <Button variant="secondary" fullWidth onClick={onClose} style={{ border: '1px solid #D3D7DA', fontWeight: 500 }}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
