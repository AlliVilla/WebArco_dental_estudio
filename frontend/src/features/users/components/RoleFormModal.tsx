import React, { useEffect, useState } from 'react';
import { Save, Shield, X } from 'lucide-react';
import { Button, Input } from '../../../context';
import type { CreateRoleInput, RoleSummary } from '../types';

export interface RoleFormModalProps {
  open: boolean;
  loading?: boolean;
  mode: 'create' | 'edit';
  role?: RoleSummary | null;
  onClose: () => void;
  onSubmit: (data: CreateRoleInput) => Promise<void> | void;
}

export function RoleFormModal({
  open,
  loading,
  mode,
  role,
  onClose,
  onSubmit,
}: RoleFormModalProps) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [errors, setErrors] = useState<{ nombre?: string }>({});

  useEffect(() => {
    if (open) {
      setNombre(role?.nombre ?? '');
      setDescripcion(role?.descripcion ?? '');
      setErrors({});
    } else {
      setNombre('');
      setDescripcion('');
      setErrors({});
    }
  }, [open, role]);

  if (!open) {
    return null;
  }

  const isEditMode = mode === 'edit';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = nombre.trim();

    if (!trimmedName) {
      setErrors({ nombre: 'El nombre del rol es obligatorio.' });
      return;
    }

    setErrors({});
    await onSubmit({
      nombre: trimmedName,
      descripcion: descripcion.trim(),
    });
  };

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
          maxWidth: 558,
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
                  width: 54,
                  height: 54,
                  borderRadius: 14,
                  background: '#E6F8FB',
                  color: '#0BC5DF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Shield size={24} strokeWidth={1.9} />
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <h3 style={{ margin: 0, color: '#203F49', fontSize: 16, fontWeight: 600 }}>
                  {isEditMode ? 'Editar Rol de Usuario' : 'Crear Nuevo Rol'}
                </h3>
                <p style={{ margin: 0, color: '#888F94', fontSize: 14, lineHeight: '20px' }}>
                  {isEditMode
                    ? 'Actualiza la información del rol del sistema.'
                    : 'Define un nuevo rol y configura sus privilegios posteriormente.'}
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

        <form onSubmit={handleSubmit} style={{ padding: '0 26px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>
                Nombre del Rol
              </label>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  padding: '3px 10px',
                  borderRadius: 8,
                  background: '#FEF2F2',
                  color: '#E24B4A',
                  border: '1px solid #F7C5C5',
                  lineHeight: '14px',
                }}
              >
                Requerido
              </span>
            </div>

            <Input
              placeholder="Ej: Recepcionista, Asistente..."
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              error={errors.nombre}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>
                Descripción
              </label>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  padding: '3px 10px',
                  borderRadius: 8,
                  background: '#F8F9FA',
                  color: '#888F94',
                  border: '1px solid #D3D7DA',
                  lineHeight: '14px',
                }}
              >
                Opcional
              </span>
            </div>

            <textarea
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
              placeholder="Describe las responsabilidades y alcance de este rol..."
              rows={4}
              style={{
                width: '100%',
                resize: 'none',
                border: '1px solid #D3D7DA',
                borderRadius: 12,
                background: '#FFFFFF',
                color: '#203F49',
                padding: '14px 15px',
                fontSize: 14,
                lineHeight: '20px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14, paddingTop: 8 }}>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              <Save size={16} />
              {isEditMode ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
