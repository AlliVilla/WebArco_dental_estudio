export type ModuloPermisoId =
  | 'login'
  | 'usuarios'
  | 'dashboard'
  | 'dashboard-financiero'
  | 'pacientes'
  | 'expediente'
  | 'odontograma'
  | 'consentimientos'
  | 'citas'
  | 'recordatorios'
  | 'financiero'
  | 'cierres'
  | 'reportes'
  | 'configuracion';

export type ModuloPermiso = {
  id: ModuloPermisoId;
  titulo: string;
  descripcion: string;
  privilegioIds: number[];
  siempreActivo?: boolean;
};

/** Privilegios que se conservan aunque no pertenezcan a un módulo visible del sidebar. */
export const PRIVILEGIOS_SIEMPRE_ACTIVOS: number[] = [33];

/** Orden de pestañas según diseño Figma. */
export const ORDEN_ROLES_PERMISOS = [
  'Administrador',
  'Doctor',
  'Especialista',
  'Contador',
] as const;

/**
 * Mapeo de módulos del sidebar a IDs de privilegios del backend.
 * Un módulo se considera habilitado cuando todos sus privilegios están asignados al rol.
 */
export const MODULOS_PERMISOS: ModuloPermiso[] = [
  {
    id: 'login',
    titulo: 'Login',
    descripcion: 'Acceso al sistema de autenticación y credenciales de ingreso',
    privilegioIds: [],
    siempreActivo: true,
  },
  {
    id: 'usuarios',
    titulo: 'Usuarios',
    descripcion: 'Gestión completa de usuarios del sistema y asignación de roles',
    privilegioIds: [6, 7, 8, 9],
  },
  {
    id: 'dashboard',
    titulo: 'Dashboard',
    descripcion: 'Panel principal con métricas clínicas y estadísticas generales',
    privilegioIds: [1],
  },
  {
    id: 'dashboard-financiero',
    titulo: 'Dashboard Financiero',
    descripcion: 'Panel de métricas financieras, ingresos y análisis económico',
    privilegioIds: [2],
  },
  {
    id: 'pacientes',
    titulo: 'Pacientes',
    descripcion: 'Búsqueda, listado y gestión del registro de pacientes',
    privilegioIds: [16, 17, 18, 19, 39, 40, 41],
  },
  {
    id: 'expediente',
    titulo: 'Expediente',
    descripcion: 'Historial clínico completo y documentación médica del paciente',
    privilegioIds: [20, 21, 42, 43, 44, 45],
  },
  {
    id: 'odontograma',
    titulo: 'Odontograma',
    descripcion: 'Registro visual interactivo del estado dental del paciente',
    privilegioIds: [3, 4, 5],
  },
  {
    id: 'consentimientos',
    titulo: 'Consentimientos',
    descripcion: 'Generación y firma de consentimientos informados',
    privilegioIds: [22, 23, 24, 25],
  },
  {
    id: 'citas',
    titulo: 'Citas',
    descripcion: 'Agenda y calendario de citas médicas programadas',
    privilegioIds: [26, 27, 28, 29, 46],
  },
  {
    id: 'recordatorios',
    titulo: 'Recordatorios',
    descripcion: 'Sistema de notificaciones y recordatorios para pacientes',
    privilegioIds: [30, 31, 32],
  },
  {
    id: 'financiero',
    titulo: 'Financiero',
    descripcion: 'Registro de ingresos, pagos y transacciones económicas',
    privilegioIds: [10, 11, 12, 13],
  },
  {
    id: 'cierres',
    titulo: 'Cierres',
    descripcion: 'Cierre de caja y cortes diarios de operaciones financieras',
    privilegioIds: [14, 15],
  },
  {
    id: 'reportes',
    titulo: 'Reportes',
    descripcion: 'Generación de reportes clínicos y estadísticas personalizadas',
    privilegioIds: [53],
  },
  {
    id: 'configuracion',
    titulo: 'Configuración',
    descripcion: 'Ajustes del sistema, preferencias y parámetros generales',
    privilegioIds: [34, 35, 36, 37, 38, 47, 48, 49, 50, 51, 52, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66],
  },
];

const IDS_GESTIONADOS = new Set(
  MODULOS_PERMISOS.flatMap((modulo) => modulo.privilegioIds),
);

export function moduloEstaHabilitado(
  modulo: ModuloPermiso,
  privilegiosAsignados: Set<number>,
): boolean {
  if (modulo.siempreActivo) {
    return true;
  }

  if (modulo.privilegioIds.length === 0) {
    return false;
  }

  return modulo.privilegioIds.every((id) => privilegiosAsignados.has(id));
}

export function aplicarCambioModulo(
  privilegiosActuales: Set<number>,
  modulo: ModuloPermiso,
  habilitado: boolean,
): Set<number> {
  const resultado = new Set(privilegiosActuales);

  if (modulo.siempreActivo || modulo.privilegioIds.length === 0) {
    return resultado;
  }

  if (habilitado) {
    modulo.privilegioIds.forEach((id) => resultado.add(id));
  } else {
    modulo.privilegioIds.forEach((id) => resultado.delete(id));
  }

  return resultado;
}

export function construirListaPrivilegios(
  privilegiosEditados: Set<number>,
  privilegiosOriginales: Set<number>,
): number[] {
  const huerfanos = [...privilegiosOriginales].filter(
    (id) => !IDS_GESTIONADOS.has(id) && !PRIVILEGIOS_SIEMPRE_ACTIVOS.includes(id),
  );

  const siempreActivos = PRIVILEGIOS_SIEMPRE_ACTIVOS.filter(
    (id) => privilegiosOriginales.has(id) || privilegiosEditados.has(id),
  );

  const combinados = new Set<number>([
    ...privilegiosEditados,
    ...huerfanos,
    ...siempreActivos,
  ]);

  return [...combinados].sort((a, b) => a - b);
}

export function contarModulosActivos(privilegiosAsignados: Set<number>): number {
  return MODULOS_PERMISOS.filter((modulo) =>
    moduloEstaHabilitado(modulo, privilegiosAsignados),
  ).length;
}

export function privilegiosDesdeRol(privilegioIds: number[]): Set<number> {
  return new Set(privilegioIds);
}
