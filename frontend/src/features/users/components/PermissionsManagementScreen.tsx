import { useCallback, useEffect, useMemo, useState } from 'react';
import { RotateCcw, Save, Shield } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Button, useTheme } from '../../../context';
import { Spinner } from '../../../components/Spinner';
import { roleService } from '../services/roleService';
import type { RoleWithPrivileges } from '../types';
import { PermissionModuleCard } from './PermissionModuleCard';
import {
  MODULOS_PERMISOS,
  ORDEN_ROLES_PERMISOS,
  aplicarCambioModulo,
  construirListaPrivilegios,
  contarModulosActivos,
  moduloEstaHabilitado,
} from '../constants/modulos-permisos';

function ordenarRoles(roles: RoleWithPrivileges[]): RoleWithPrivileges[] {
  return [...roles].sort((a, b) => {
    const indiceA = ORDEN_ROLES_PERMISOS.indexOf(
      a.nombre as (typeof ORDEN_ROLES_PERMISOS)[number],
    );
    const indiceB = ORDEN_ROLES_PERMISOS.indexOf(
      b.nombre as (typeof ORDEN_ROLES_PERMISOS)[number],
    );
    const pesoA = indiceA === -1 ? Number.MAX_SAFE_INTEGER : indiceA;
    const pesoB = indiceB === -1 ? Number.MAX_SAFE_INTEGER : indiceB;
    return pesoA - pesoB;
  });
}

function setsSonIguales(a: Set<number>, b: Set<number>): boolean {
  if (a.size !== b.size) {
    return false;
  }

  return [...a].every((id) => b.has(id));
}

export function PermissionsManagementScreen() {
  useTheme();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [roles, setRoles] = useState<RoleWithPrivileges[]>([]);
  const [rolActivoId, setRolActivoId] = useState<number | null>(null);
  const [privilegiosGuardados, setPrivilegiosGuardados] = useState<Set<number>>(new Set());
  const [privilegiosEditados, setPrivilegiosEditados] = useState<Set<number>>(new Set());
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const rolActivo = useMemo(
    () => roles.find((rol) => rol.id_rol === rolActivoId) ?? null,
    [roles, rolActivoId],
  );

  const hayCambios = useMemo(
    () => !setsSonIguales(privilegiosGuardados, privilegiosEditados),
    [privilegiosGuardados, privilegiosEditados],
  );

  const modulosActivos = useMemo(
    () => contarModulosActivos(privilegiosEditados),
    [privilegiosEditados],
  );

  const cargarRoles = useCallback(async (rolInicial?: number) => {
    setCargando(true);
    try {
      const response = await roleService.getAllWithPrivileges();

      if (!response.success) {
        setErrorMessage(response.message);
        return;
      }

      const rolesOrdenados = ordenarRoles(response.data);
      setRoles(rolesOrdenados);
      setErrorMessage(null);

      const rolParam = rolInicial ?? Number(searchParams.get('rol'));
      const rolSeleccionado =
        rolesOrdenados.find((rol) => rol.id_rol === rolParam) ?? rolesOrdenados[0] ?? null;

      if (rolSeleccionado) {
        const ids = new Set(rolSeleccionado.privilegios.map((p) => p.id_privilegio));
        setRolActivoId(rolSeleccionado.id_rol);
        setPrivilegiosGuardados(ids);
        setPrivilegiosEditados(new Set(ids));
      }
    } catch (error) {
      const err = error as Error;
      setErrorMessage(err.message || 'Error al cargar los permisos.');
    } finally {
      setCargando(false);
    }
  }, [searchParams]);

  useEffect(() => {
    void cargarRoles();
  }, [cargarRoles]);

  function seleccionarRol(rol: RoleWithPrivileges) {
    if (hayCambios) {
      const confirmar = window.confirm(
        'Tienes cambios sin guardar. ¿Deseas descartarlos y cambiar de rol?',
      );
      if (!confirmar) {
        return;
      }
    }

    const ids = new Set(rol.privilegios.map((p) => p.id_privilegio));
    setRolActivoId(rol.id_rol);
    setPrivilegiosGuardados(ids);
    setPrivilegiosEditados(new Set(ids));
    setSuccessMessage(null);
    setErrorMessage(null);
    navigate(`/users/roles/permisos?rol=${rol.id_rol}`, { replace: true });
  }

  function manejarToggleModulo(moduloId: string, habilitado: boolean) {
    const modulo = MODULOS_PERMISOS.find((item) => item.id === moduloId);
    if (!modulo || modulo.siempreActivo) {
      return;
    }

    setPrivilegiosEditados((actual) => aplicarCambioModulo(actual, modulo, habilitado));
  }

  function restablecerValores() {
    setPrivilegiosEditados(new Set(privilegiosGuardados));
    setSuccessMessage(null);
    setErrorMessage(null);
  }

  async function guardarCambios() {
    if (!rolActivo) {
      return;
    }

    const listaPrivilegios = construirListaPrivilegios(privilegiosEditados, privilegiosGuardados);

    if (listaPrivilegios.length === 0) {
      setErrorMessage('El rol debe conservar al menos un privilegio asignado.');
      return;
    }

    setGuardando(true);
    try {
      const response = await roleService.assignPrivileges(rolActivo.id_rol, {
        id_privilegios: listaPrivilegios,
      });

      if (response.success) {
        setSuccessMessage(response.message || 'Permisos guardados correctamente.');
        setErrorMessage(null);
        await cargarRoles(rolActivo.id_rol);
        window.setTimeout(() => setSuccessMessage(null), 3500);
      } else {
        setErrorMessage(response.message);
      }
    } catch (error) {
      const err = error as Error;
      setErrorMessage(err.message || 'Error al guardar los permisos.');
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 320,
          gap: 12,
          color: '#888F94',
          fontSize: 14,
        }}
      >
        <Spinner size={28} color="#0BC5DF" />
        Cargando permisos...
      </div>
    );
  }

  if (!rolActivo) {
    return (
      <Alert
        variant="error"
        message="No se encontraron roles para gestionar permisos."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {errorMessage ? (
        <Alert variant="error" message={errorMessage} onClose={() => setErrorMessage(null)} />
      ) : null}
      {successMessage ? (
        <Alert variant="success" message={successMessage} onClose={() => setSuccessMessage(null)} />
      ) : null}

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 250 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 600,
              color: '#203F49',
              lineHeight: '36px',
            }}
          >
            Gestión de Permisos
          </h1>
          <p style={{ margin: 0, fontSize: 14, lineHeight: '21px', color: '#888F94' }}>
            Gestiona los permisos y el alcance de acceso para cada rol de usuario en el sistema
            basado en los módulos del sidebar.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={restablecerValores}
            disabled={!hayCambios || guardando}
            style={{ color: '#203F49', padding: '10px 16px' }}
          >
            <RotateCcw size={16} />
            Restablecer Valores
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            loading={guardando}
            onClick={() => void guardarCambios()}
            disabled={!hayCambios}
            style={{ padding: '10px 16px' }}
          >
            <Save size={16} />
            Guardar Cambios
          </Button>
        </div>
      </div>

      <div
        style={{
          background: '#ECECF0',
          borderRadius: 14,
          padding: 3,
          display: 'inline-flex',
          alignSelf: 'flex-start',
          flexWrap: 'wrap',
          gap: 0,
        }}
      >
        {roles.map((rol) => {
          const activo = rol.id_rol === rolActivoId;
          return (
            <button
              key={rol.id_rol}
              type="button"
              onClick={() => seleccionarRol(rol)}
              style={{
                border: '0.8px solid transparent',
                borderRadius: 14,
                padding: '5px 12px',
                fontSize: 14,
                fontWeight: 500,
                lineHeight: '20px',
                cursor: 'pointer',
                background: activo ? '#FFFFFF' : 'transparent',
                color: '#0A0A0A',
                boxShadow: activo ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'background 0.15s ease',
              }}
            >
              {rol.nombre}
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16,
        }}
      >
        {MODULOS_PERMISOS.map((modulo) => (
          <PermissionModuleCard
            key={modulo.id}
            modulo={modulo}
            habilitado={moduloEstaHabilitado(modulo, privilegiosEditados)}
            onToggle={(habilitado) => manejarToggleModulo(modulo.id, habilitado)}
            deshabilitado={guardando}
          />
        ))}
      </div>

      <div
        style={{
          background: '#E6F8FB',
          borderRadius: 8,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: '#FFFFFF',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0BC5DF',
            flexShrink: 0,
          }}
        >
          <Shield size={20} strokeWidth={1.8} />
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <strong style={{ fontSize: 14, fontWeight: 600, color: '#203F49' }}>
            {rolActivo.nombre}
          </strong>
          <span style={{ fontSize: 13, color: '#888F94' }}>
            {modulosActivos} de {MODULOS_PERMISOS.length} permisos activos
          </span>
        </div>
      </div>
    </div>
  );
}
