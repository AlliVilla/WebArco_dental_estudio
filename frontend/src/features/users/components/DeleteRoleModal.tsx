import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from '../../../context';
import type { RoleSummary } from '../types';

export interface DeleteRoleModalProps {
  open: boolean;
  loading?: boolean;
  role?: RoleSummary | null;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export function DeleteRoleModal({
  open,
  loading,
  role,
  onClose,
  onConfirm,
}: DeleteRoleModalProps) {
  if (!open || !role) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(32, 63, 73, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 492,
          background: '#FFFFFF',
          border: '1px solid #D3D7DA',
          borderRadius: 14,
          boxShadow: '0 20px 40px rgba(32, 63, 73, 0.18)',
          overflow: 'hidden',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ padding: '24px 26px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <span
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: '#FEF2F2',
                  color: '#E24B4A',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={24} strokeWidth={1.9} />
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <h3 style={{ margin: 0, color: '#203F49', fontSize: 16, fontWeight: 600 }}>
                  ¿Eliminar Rol de Usuario?
                </h3>
                <p style={{ margin: 0, color: '#888F94', fontSize: 14, lineHeight: '22px' }}>
                  Esta acción no se puede deshacer. Los usuarios asignados a este rol perderán sus permisos
                  actuales hasta que se les asigne uno nuevo.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#5F656A',
                cursor: 'pointer',
                display: 'inline-flex',
                padding: 2,
              }}
            >
              <X size={20} strokeWidth={1.9} />
            </button>
          </div>
        </div>

        <div style={{ padding: '0 26px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              border: '1px solid #F7C5C5',
              borderRadius: 10,
              background: '#FEF2F2',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <p style={{ margin: 0, color: '#203F49', fontSize: 13, lineHeight: '20px' }}>
              <strong>Rol a eliminar:</strong> {role.nombre}
            </p>
            <p style={{ margin: 0, color: '#203F49', fontSize: 13, lineHeight: '20px' }}>
              <strong>Usuarios afectados:</strong> {role.usuariosActivos} usuarios
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14 }}>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="button" variant="danger" onClick={onConfirm} loading={loading}>
              <Trash2 size={16} />
              Eliminar Rol
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
