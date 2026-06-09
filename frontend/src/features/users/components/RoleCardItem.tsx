import { Edit2, SlidersHorizontal, Trash2, UserRoundCog } from 'lucide-react';
import { Card } from '../../../context';
import type { RoleSummary } from '../types';

export interface RoleCardItemProps {
  role: RoleSummary;
  onDelete?: (role: RoleSummary) => void;
  onEdit?: (role: RoleSummary) => void;
  onPrivileges?: (role: RoleSummary) => void;
}

export function RoleCardItem({
  role,
  onDelete,
  onEdit,
  onPrivileges,
}: RoleCardItemProps) {
  return (
    <Card
      style={{
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 196,
        background: '#FFFFFF',
        border: '1px solid #D3D7DA',
      }}
    >
      <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <span
            style={{
              width: 62,
              height: 62,
              borderRadius: 14,
              background: '#E6F8FB',
              color: '#0BC5DF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <UserRoundCog size={28} strokeWidth={1.9} />
          </span>
          <h3 style={{ margin: 0, color: '#203F49', fontSize: 16, fontWeight: 600 }}>
            {role.nombre}
          </h3>
        </div>

        <p style={{ margin: 0, color: '#888F94', fontSize: 14, lineHeight: '20px' }}>
          {role.descripcion || 'Sin descripción registrada para este rol.'}
        </p>

        <span
          style={{
            width: 'fit-content',
            borderRadius: 10,
            background: '#E6F8FB',
            color: '#0BC5DF',
            fontSize: 12,
            fontWeight: 600,
            padding: '10px 18px',
            lineHeight: '12px',
          }}
        >
          {role.usuariosActivos} usuarios activos
        </span>
      </div>

      <div
        style={{
          borderTop: '1px solid #D3D7DA',
          padding: '18px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={() => onPrivileges?.(role)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: 'transparent',
            border: 'none',
            color: '#203F49',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            padding: 0,
          }}
        >
          <SlidersHorizontal size={18} strokeWidth={1.9} />
          Privilegios
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <button
            type="button"
            aria-label={`Editar rol ${role.nombre}`}
            onClick={() => onEdit?.(role)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#203F49',
              cursor: 'pointer',
              display: 'inline-flex',
              padding: 0,
            }}
          >
            <Edit2 size={22} strokeWidth={1.9} />
          </button>
          <button
            type="button"
            aria-label={`Eliminar rol ${role.nombre}`}
            onClick={() => onDelete?.(role)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#E24B4A',
              cursor: 'pointer',
              display: 'inline-flex',
              padding: 0,
            }}
          >
            <Trash2 size={22} strokeWidth={1.9} />
          </button>
        </div>
      </div>
    </Card>
  );
}
