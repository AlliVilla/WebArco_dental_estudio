import { ToggleSwitch } from '../../../components/ToggleSwitch';
import type { Privilegio } from '../types';
import { formatearNombrePrivilegio } from '../constants/modulos-permisos';

export interface PermissionPrivilegeCardProps {
  privilegio: Privilegio;
  asignado: boolean;
  onToggle: (habilitado: boolean) => void;
  deshabilitado?: boolean;
}

export function PermissionPrivilegeCard({
  privilegio,
  asignado,
  onToggle,
  deshabilitado = false,
}: PermissionPrivilegeCardProps) {
  return (
    <article
      style={{
        background: '#FFFFFF',
        border: '0.8px solid #D3D7DA',
        borderRadius: 8,
        padding: '16px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        minHeight: 56,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: '#203F49',
            lineHeight: '20px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {formatearNombrePrivilegio(privilegio.nombre)}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.3px',
            textTransform: 'uppercase',
            color: '#0BC5DF',
            lineHeight: '14px',
          }}
        >
          {asignado ? 'Permitido' : 'No Permitido'}
        </span>
      </div>

      <ToggleSwitch
        checked={asignado}
        onChange={onToggle}
        disabled={deshabilitado}
      />
    </article>
  );
}
