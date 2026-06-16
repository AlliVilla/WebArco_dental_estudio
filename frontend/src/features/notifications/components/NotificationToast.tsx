import React, { useEffect, useRef } from 'react';
import { Bell, X, Calendar, CheckCircle, XCircle } from 'lucide-react';
import type { Notificacion, TipoNotificacion } from '../types';

interface NotificationToastProps {
  notification: Notificacion;
  onClose: () => void;
}

const TIPO_ICON: Record<TipoNotificacion, React.ReactNode> = {
  cita_proxima: <Calendar size={16} style={{ color: '#F59E0B', flexShrink: 0 }} />,
  cita_confirmada: <CheckCircle size={16} style={{ color: '#1D9E75', flexShrink: 0 }} />,
  cita_cancelada: <XCircle size={16} style={{ color: '#E24B4A', flexShrink: 0 }} />,
};

const TIPO_COLOR: Record<TipoNotificacion, string> = {
  cita_proxima: '#FFF8E6',
  cita_confirmada: '#E8F9F3',
  cita_cancelada: '#FEF2F2',
};

const TIPO_BORDER: Record<TipoNotificacion, string> = {
  cita_proxima: '#F59E0B',
  cita_confirmada: '#1D9E75',
  cita_cancelada: '#E24B4A',
};

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
}) => {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timerRef.current);
  }, [onClose]);

  const bgColor = TIPO_COLOR[notification.tipo];
  const borderColor = TIPO_BORDER[notification.tipo];
  const icon = TIPO_ICON[notification.tipo];

  return (
    <>
      <style>{`
        @keyframes toast-slide-in {
          from {
            transform: translateX(calc(100% + 60px));
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes toast-slide-out {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(calc(100% + 60px));
            opacity: 0;
          }
        }
        .notification-toast {
          animation: toast-slide-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
      <div
        className="notification-toast"
        style={{
          position: 'fixed',
          top: 14,
          right: 60,
          zIndex: 9999,
          background: bgColor,
          border: `1.5px solid ${borderColor}`,
          borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          maxWidth: 320,
          minWidth: 220,
          cursor: 'pointer',
        }}
        onClick={onClose}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#203F49',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {notification.titulo}
          </div>
          <div
            style={{
              fontSize: 12,
              color: '#5F656A',
              marginTop: 2,
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {notification.mensaje}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 2,
            color: '#888F94',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={14} />
        </button>
      </div>
    </>
  );
};

// Pequeño indicador animado en el bell cuando hay no leídas
export const BellBadge: React.FC<{ count: number }> = ({ count }) => {
  if (count === 0) return null;
  return (
    <>
      <style>{`
        @keyframes badge-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.25); }
        }
        .bell-badge {
          animation: badge-pulse 2s ease-in-out infinite;
        }
      `}</style>
      <span
        className="bell-badge"
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          background: '#E24B4A',
          border: '2px solid #fff',
          borderRadius: '50%',
          minWidth: 18,
          height: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          fontWeight: 700,
          color: '#fff',
          lineHeight: 1,
          padding: '0 3px',
        }}
      >
        {count > 99 ? '99+' : count}
      </span>
    </>
  );
};
