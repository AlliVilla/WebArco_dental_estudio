import type { ModuloPermiso } from '../constants/modulos-permisos';

export interface PermissionModuleCardProps {
  modulo: ModuloPermiso;
  habilitado: boolean;
  onToggle: (habilitado: boolean) => void;
  deshabilitado?: boolean;
}

function PermissionSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (valor: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        border: 'none',
        padding: 0,
        background: checked ? '#1D9E75' : '#D3D7DA',
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: checked ? 22 : 2,
          width: 20,
          height: 20,
          borderRadius: 10,
          background: '#FFFFFF',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }}
      />
    </button>
  );
}

export function PermissionModuleCard({
  modulo,
  habilitado,
  onToggle,
  deshabilitado = false,
}: PermissionModuleCardProps) {
  const esFijo = Boolean(modulo.siempreActivo);
  const bloqueado = deshabilitado || esFijo;

  return (
    <article
      style={{
        background: '#FFFFFF',
        border: '0.8px solid #D3D7DA',
        borderRadius: 8,
        padding: '20px 21px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minHeight: 184,
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          color: '#0BC5DF',
          lineHeight: '13px',
        }}
      >
        Módulo
      </span>

      <h3
        style={{
          margin: 0,
          fontSize: 16,
          fontWeight: 600,
          color: '#203F49',
          lineHeight: '21px',
        }}
      >
        {modulo.titulo}
      </h3>

      <p
        style={{
          margin: 0,
          fontSize: 12,
          lineHeight: '18px',
          color: '#888F94',
          flex: 1,
        }}
      >
        {modulo.descripcion}
      </p>

      <div
        style={{
          borderTop: '0.8px solid #D3D7DA',
          paddingTop: 13,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'auto',
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: habilitado ? '#1D9E75' : '#888F94',
          }}
        >
          {habilitado ? 'Permitido' : 'No Permitido'}
        </span>

        <PermissionSwitch
          checked={habilitado}
          onChange={onToggle}
          disabled={bloqueado}
        />
      </div>
    </article>
  );
}
