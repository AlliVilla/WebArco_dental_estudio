import { useCallback, useEffect, useMemo, useState } from 'react';
import { RotateCcw, Save, Shield } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ConfirmModal, Spinner } from '../../../components';
import { Alert, Button, useTheme } from '../../../context';
import {
  ORDEN_ROLES_PERMISOS,
  construirListaPrivilegios,
  formatearNombrePrivilegio,
} from '../constants/modulos-permisos';
import { privilegeService } from '../services/privilegeService';
import { roleService } from '../services/roleService';
import type { Privilegio, RoleWithPrivileges } from '../types';
import { PermissionPrivilegeCard } from './PermissionPrivilegeCard';

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
  const [privilegiosDisponibles, setPrivilegiosDisponibles] = useState<Privilegio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDiscardChangesModal, setShowDiscardChangesModal] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState<RoleWithPrivileges | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_POR_PAGINA = 24;

  const rolActivo = useMemo(
    () => roles.find((rol) => rol.id_rol === rolActivoId) ?? null,
    [roles, rolActivoId],
  );

  const hayCambios = useMemo(
    () => !setsSonIguales(privilegiosGuardados, privilegiosEditados),
    [privilegiosGuardados, privilegiosEditados],
  );

  const privilegiosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return privilegiosDisponibles;
    const termino = busqueda.toLowerCase();
    return privilegiosDisponibles.filter((p) =>
      formatearNombrePrivilegio(p.nombre).toLowerCase().includes(termino) ||
      p.nombre.toLowerCase().includes(termino),
    );
  }, [privilegiosDisponibles, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(privilegiosFiltrados.length / ITEMS_POR_PAGINA));
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const privilegiosPaginados = useMemo(
    () => privilegiosFiltrados.slice((paginaSegura - 1) * ITEMS_POR_PAGINA, paginaSegura * ITEMS_POR_PAGINA),
    [privilegiosFiltrados, paginaSegura],
  );

  const cargarRoles = useCallback(async (rolInicial?: number) => {
    setCargando(true);
    try {
      const [rolesResponse, privilegiosResponse] = await Promise.all([
        roleService.getAllWithPrivileges(),
        privilegeService.getAll(),
      ]);

      if (!rolesResponse.success) {
        setErrorMessage(rolesResponse.message);
        return;
      }

      if (!privilegiosResponse.success) {
        setErrorMessage(privilegiosResponse.message);
        return;
      }

      setPrivilegiosDisponibles(privilegiosResponse.data);
      setErrorMessage(null);

      const rolesOrdenados = ordenarRoles(rolesResponse.data);
      setRoles(rolesOrdenados);

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

  function aplicarSeleccionDeRol(rol: RoleWithPrivileges) {
    const ids = new Set(rol.privilegios.map((p) => p.id_privilegio));
    setRolActivoId(rol.id_rol);
    setPrivilegiosGuardados(ids);
    setPrivilegiosEditados(new Set(ids));
    setSuccessMessage(null);
    setErrorMessage(null);
    setBusqueda('');
    setPaginaActual(1);
    navigate(`/users/roles/permisos?rol=${rol.id_rol}`, { replace: true });
  }

  function seleccionarRol(rol: RoleWithPrivileges) {
    if (hayCambios) {
      setPendingRoleChange(rol);
      setShowDiscardChangesModal(true);
      return;
    }

    aplicarSeleccionDeRol(rol);
  }

  function confirmarCambioDeRol() {
    if (pendingRoleChange) {
      aplicarSeleccionDeRol(pendingRoleChange);
    }

    setPendingRoleChange(null);
    setShowDiscardChangesModal(false);
  }

  function cancelarCambioDeRol() {
    setPendingRoleChange(null);
    setShowDiscardChangesModal(false);
  }

  function togglePrivilegio(id: number, habilitado: boolean) {
    setPrivilegiosEditados((prev) => {
      const nuevo = new Set(prev);
      if (habilitado) {
        nuevo.add(id);
      } else {
        nuevo.delete(id);
      }
      return nuevo;
    });
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

    const listaPrivilegios = construirListaPrivilegios(privilegiosEditados);

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

  const totalPrivilegios = privilegiosDisponibles.length;
  const activos = privilegiosEditados.size;

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
            Activa o desactiva privilegios individuales para cada rol del sistema.
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
            {activos} de {totalPrivilegios} privilegios activos
          </span>
        </div>
      </div>

      <input
        type="text"
        placeholder="Buscar privilegio..."
        value={busqueda}
        onChange={(e) => {
          setBusqueda(e.target.value);
          setPaginaActual(1);
        }}
        style={{
          padding: '10px 14px',
          borderRadius: 8,
          border: '0.8px solid #D3D7DA',
          fontSize: 14,
          outline: 'none',
          width: '100%',
          maxWidth: 400,
          boxSizing: 'border-box',
        }}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 12,
        }}
      >
        {privilegiosPaginados.map((privilegio) => (
          <PermissionPrivilegeCard
            key={privilegio.id_privilegio}
            privilegio={privilegio}
            asignado={privilegiosEditados.has(privilegio.id_privilegio)}
            onToggle={(habilitado) => togglePrivilegio(privilegio.id_privilegio, habilitado)}
            deshabilitado={guardando}
          />
        ))}
      </div>

      {totalPaginas > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
            disabled={paginaSegura <= 1}
            style={{
              border: '0.8px solid #D3D7DA',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: 13,
              background: '#FFFFFF',
              cursor: paginaSegura <= 1 ? 'not-allowed' : 'pointer',
              opacity: paginaSegura <= 1 ? 0.5 : 1,
              color: '#203F49',
            }}
          >
            Anterior
          </button>
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pag) => (
            <button
              key={pag}
              type="button"
              onClick={() => setPaginaActual(pag)}
              style={{
                border: '0.8px solid transparent',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 13,
                fontWeight: pag === paginaSegura ? 600 : 400,
                background: pag === paginaSegura ? '#0BC5DF' : '#FFFFFF',
                color: pag === paginaSegura ? '#FFFFFF' : '#203F49',
                cursor: 'pointer',
                minWidth: 32,
                textAlign: 'center',
              }}
            >
              {pag}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
            disabled={paginaSegura >= totalPaginas}
            style={{
              border: '0.8px solid #D3D7DA',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: 13,
              background: '#FFFFFF',
              cursor: paginaSegura >= totalPaginas ? 'not-allowed' : 'pointer',
              opacity: paginaSegura >= totalPaginas ? 0.5 : 1,
              color: '#203F49',
            }}
          >
            Siguiente
          </button>
        </div>
      )}

      <ConfirmModal
        open={showDiscardChangesModal}
        onClose={cancelarCambioDeRol}
        onConfirm={confirmarCambioDeRol}
        variant="info"
        title="Descartar cambios"
        description="Tienes cambios sin guardar. Si cambias de rol ahora, se descartarán los ajustes que hiciste en los permisos."
        confirmLabel="Descartar y cambiar"
        cancelLabel="Seguir editando"
      />
    </div>
  );
}
