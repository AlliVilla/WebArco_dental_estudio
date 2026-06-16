import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Notificacion, TipoNotificacion } from '../types';
import { useNotificationStore } from '../hooks/useNotifications';

interface NotificationCardProps {
  notification: Notificacion;
  onClose?: () => void;
}

const TIPO_META: Record<
  TipoNotificacion,
  { icon: React.ReactNode; color: string; border: string; bg: string; bgUnread: string; label: string }
> = {
  cita_proxima: {
    icon: <Clock size={18} />,
    color: '#F59E0B',
    border: '#F59E0B',
    bg: '#FFFCF0',
    bgUnread: '#FFF8DC',
    label: 'Cita Próxima',
  },
  cita_confirmada: {
    icon: <CheckCircle size={18} />,
    color: '#1D9E75',
    border: '#1D9E75',
    bg: '#F0FAF6',
    bgUnread: '#DCFCF0',
    label: 'Confirmada',
  },
  cita_cancelada: {
    icon: <XCircle size={18} />,
    color: '#E24B4A',
    border: '#E24B4A',
    bg: '#FFF5F5',
    bgUnread: '#FFE8E8',
    label: 'Cancelada',
  },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'ahora mismo';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onClose,
}) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const { markAsRead } = useNotificationStore();

  const meta = TIPO_META[notification.tipo];
  const bg = notification.leida ? meta.bg : meta.bgUnread;

  const pacienteNombre = notification.cita?.persona
    ? [
        notification.cita.persona.primer_nombre,
        notification.cita.persona.segundo_nombre,
        notification.cita.persona.primer_apellido,
        notification.cita.persona.segundo_apellido,
      ]
        .filter(Boolean)
        .join(' ')
    : null;

  const fechaCita = notification.cita?.fecha_inicio
    ? new Date(notification.cita.fecha_inicio)
    : null;

  const handleExpand = async () => {
    if (!notification.leida) {
      await markAsRead(notification.id);
    }
    setExpanded((v) => !v);
  };

  const handleGoToAppointment = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.leida) await markAsRead(notification.id);
    if (notification.id_cita) {
      navigate(`/agenda/${notification.id_cita}`);
      onClose?.();
    }
  };

  return (
    <>
      <style>{`
        @keyframes card-expand {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .notif-card-detail {
          animation: card-expand 0.2s ease-out forwards;
        }
        .notif-card:hover {
          filter: brightness(0.97);
        }
      `}</style>
      <div
        className="notif-card"
        style={{
          background: bg,
          borderRadius: 10,
          border: `1px solid ${notification.leida ? '#E8EAEC' : meta.border}`,
          marginBottom: 8,
          overflow: 'hidden',
          transition: 'all 0.15s',
          cursor: 'pointer',
          boxShadow: notification.leida
            ? 'none'
            : `0 2px 8px ${meta.color}22`,
        }}
        onClick={handleExpand}
      >
        {/* Header de la card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: '12px 14px',
          }}
        >
          {/* Ícono tipo */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: `${meta.color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: meta.color,
              flexShrink: 0,
            }}
          >
            {meta.icon}
          </div>

          {/* Contenido */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: meta.color,
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                }}
              >
                {meta.label}
              </span>
              <span style={{ fontSize: 11, color: '#888F94', flexShrink: 0 }}>
                {timeAgo(notification.created_at)}
              </span>
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: notification.leida ? 400 : 600,
                color: '#203F49',
                marginTop: 2,
                lineHeight: 1.35,
              }}
            >
              {notification.titulo}
            </div>
            <div
              style={{
                fontSize: 12,
                color: '#5F656A',
                marginTop: 3,
                lineHeight: 1.4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: expanded ? 'normal' : 'nowrap',
              }}
            >
              {notification.mensaje}
            </div>
          </div>

          {/* Chevron */}
          <div style={{ color: '#888F94', flexShrink: 0, marginTop: 2 }}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>

        {/* Detalle expandido */}
        {expanded && (
          <div
            className="notif-card-detail"
            style={{
              borderTop: `1px solid ${meta.color}30`,
              padding: '12px 14px',
              background: 'rgba(255,255,255,0.6)',
            }}
          >
            {pacienteNombre && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 8,
                  fontSize: 13,
                  color: '#203F49',
                }}
              >
                <User size={14} style={{ color: '#0BC5DF' }} />
                <span>
                  <strong>Paciente:</strong> {pacienteNombre}
                </span>
              </div>
            )}
            {fechaCita && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 8,
                  fontSize: 13,
                  color: '#203F49',
                }}
              >
                <Calendar size={14} style={{ color: '#0BC5DF' }} />
                <span>
                  <strong>Fecha:</strong>{' '}
                  {fechaCita.toLocaleDateString('es-HN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  {' — '}
                  {fechaCita.toLocaleTimeString('es-HN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
            {notification.cita?.tipo_cita && (
              <div
                style={{
                  fontSize: 12,
                  color: '#5F656A',
                  marginBottom: 8,
                }}
              >
                <strong>Tipo:</strong> {notification.cita.tipo_cita}
                {notification.cita.motivo && ` — ${notification.cita.motivo}`}
              </div>
            )}

            {/* Estado badge */}
            {notification.cita?.estado && (
              <div style={{ marginBottom: 10 }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 10px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 600,
                    background:
                      notification.cita.estado === 'confirmada'
                        ? '#E8F9F3'
                        : notification.cita.estado === 'reprogramada'
                        ? '#FEF2F2'
                        : '#EEF2F7',
                    color:
                      notification.cita.estado === 'confirmada'
                        ? '#1D9E75'
                        : notification.cita.estado === 'reprogramada'
                        ? '#E24B4A'
                        : '#203F49',
                    textTransform: 'capitalize',
                  }}
                >
                  {notification.cita.estado}
                </span>
              </div>
            )}

            {notification.id_cita && (
              <button
                onClick={handleGoToAppointment}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  background: `linear-gradient(135deg, ${meta.color}, #203F49)`,
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '100%',
                  justifyContent: 'center',
                }}
              >
                <ExternalLink size={13} />
                Ver detalle de la cita
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};
