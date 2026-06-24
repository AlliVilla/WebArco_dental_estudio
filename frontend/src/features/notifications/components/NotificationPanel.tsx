import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  X,
  CheckCheck,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Settings,
  ChevronDown,
  ChevronUp,
  Inbox,
  RefreshCw,
} from 'lucide-react';
import { useNotificationStore } from '../hooks/useNotifications';
import { NotificationCard } from './NotificationCard';
import { NotificationConfig } from './NotificationConfig';

interface NotificationPanelProps {
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  onClose,
}) => {
  const {
    notifications,
    total,
    page,
    totalPages,
    unreadCount,
    order,
    isLoading,
    fetchNotifications,
    markAllAsRead,
    setOrder,
  } = useNotificationStore();

  const [showConfig, setShowConfig] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleOrderToggle = () => {
    setOrder(order === 'desc' ? 'asc' : 'desc');
  };

  const handlePage = (newPage: number) => {
    fetchNotifications(newPage, order);
  };

  return (
    <>
      <style>{`
        @keyframes panel-slide-down {
          from { opacity: 0; transform: translateY(-12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .notif-panel {
          animation: panel-slide-down 0.22s cubic-bezier(0.34,1.26,0.64,1) forwards;
        }
        .notif-scroll::-webkit-scrollbar { width: 5px; }
        .notif-scroll::-webkit-scrollbar-track { background: transparent; }
        .notif-scroll::-webkit-scrollbar-thumb { background: #D3D7DA; border-radius: 3px; }
      `}</style>

      <div
        ref={panelRef}
        className="notif-panel"
        style={{
          position: 'absolute',
          top: 52,
          right: 0,
          width: 380,
          maxHeight: 'calc(100vh - 80px)',
          background: '#fff',
          borderRadius: 14,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          border: '1px solid #E8EAEC',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 1000,
        }}
      >
        {/* Header del panel */}
        <div
          style={{
            padding: '16px 20px 12px',
            borderBottom: '1px solid #E8EAEC',
            background: 'linear-gradient(135deg, #f0fbfe, #fff)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={18} style={{ color: '#0BC5DF' }} />
              <h3
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#203F49',
                }}
              >
                Notificaciones
              </h3>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: '#0BC5DF',
                    color: '#fff',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '1px 8px',
                  }}
                >
                  {unreadCount} nuevas
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <RefreshCw 
                size={16} 
                style={{ 
                  color: isLoading ? '#0BC5DF' : '#888F94',
                  cursor: 'pointer',
                  marginRight: 8,
                  animation: isLoading ? 'spin 1s linear infinite' : 'none'
                }} 
                onClick={() => fetchNotifications(1, order)}
              />
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#888F94',
                  display: 'flex',
                  padding: 4,
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Controles */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 10,
              gap: 8,
            }}
          >
            <button
              onClick={handleOrderToggle}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: '#F0F2F4',
                border: 'none',
                borderRadius: 8,
                padding: '5px 10px',
                fontSize: 12,
                color: '#5F656A',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              <ArrowUpDown size={13} />
              {order === 'desc' ? 'Más recientes' : 'Más antiguas'}
            </button>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  color: '#0BC5DF',
                  fontWeight: 600,
                }}
              >
                <CheckCheck size={14} />
                Marcar todo como leído
              </button>
            )}
          </div>
        </div>

        {/* Lista de notificaciones */}
        <div
          className="notif-scroll"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 16px',
          }}
        >
          {isLoading ? (
            <div
              style={{
                textAlign: 'center',
                padding: 40,
                color: '#888F94',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  border: '3px solid #E8EAEC',
                  borderTopColor: '#0BC5DF',
                  borderRadius: '50%',
                  margin: '0 auto 12px',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ margin: 0, fontSize: 13 }}>Cargando notificaciones...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#888F94',
              }}
            >
              <Inbox size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>
                Sin notificaciones
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 12 }}>
                Las alertas de citas aparecerán aquí.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <NotificationCard
                key={notif.id}
                notification={notif}
                onClose={onClose}
              />
            ))
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              borderTop: '1px solid #E8EAEC',
              background: '#FAFBFC',
            }}
          >
            <span style={{ fontSize: 12, color: '#888F94' }}>
              Página {page} de {totalPages} ({total} total)
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                disabled={page <= 1}
                onClick={() => handlePage(page - 1)}
                style={{
                  background: page <= 1 ? '#F0F2F4' : '#E6F8FB',
                  border: 'none',
                  borderRadius: 6,
                  padding: '5px 8px',
                  cursor: page <= 1 ? 'default' : 'pointer',
                  color: page <= 1 ? '#B0B7BC' : '#0BC5DF',
                  display: 'flex',
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => handlePage(page + 1)}
                style={{
                  background: page >= totalPages ? '#F0F2F4' : '#E6F8FB',
                  border: 'none',
                  borderRadius: 6,
                  padding: '5px 8px',
                  cursor: page >= totalPages ? 'default' : 'pointer',
                  color: page >= totalPages ? '#B0B7BC' : '#0BC5DF',
                  display: 'flex',
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Configuración colapsable */}
        <div>
          <button
            onClick={() => setShowConfig((v) => !v)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 20px',
              background: '#FAFBFC',
              border: 'none',
              borderTop: '1px solid #E8EAEC',
              cursor: 'pointer',
              fontSize: 12,
              color: '#5F656A',
              fontWeight: 500,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Settings size={14} style={{ color: '#0BC5DF' }} />
              Configuración de notificaciones
            </span>
            {showConfig ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showConfig && <NotificationConfig />}
        </div>
      </div>
    </>
  );
};
