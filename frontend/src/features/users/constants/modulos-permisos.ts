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
  | 'configuracion'
  | 'otros';

export type ModuloPermiso = {
  id: ModuloPermisoId;
  titulo: string;
  descripcion: string;
  privilegioIds: number[];
  siempreActivo?: boolean;
};

/** Orden de pestañas según diseño Figma. */
export const ORDEN_ROLES_PERMISOS = [
  'Administrador',
  'Doctor',
  'Especialista',
  'Contador',
] as const;

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
    privilegioIds: [6, 7, 9],
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
    privilegioIds: [16, 17],
  },
  {
    id: 'expediente',
    titulo: 'Expediente',
    descripcion: 'Historial clínico completo y documentación médica del paciente',
    privilegioIds: [20, 21, 42, 43],
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
    privilegioIds: [22, 25],
  },
  {
    id: 'citas',
    titulo: 'Citas',
    descripcion: 'Agenda y calendario de citas médicas programadas',
    privilegioIds: [26, 27],
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
    privilegioIds: [],
  },
  {
    id: 'configuracion',
    titulo: 'Configuración',
    descripcion: 'Ajustes del sistema, preferencias y parámetros generales',
    privilegioIds: [34, 35, 37, 38, 62, 63, 64],
  },
];

export function construirListaPrivilegios(
  privilegiosEditados: Set<number>,
): number[] {
  return [...privilegiosEditados].sort((a, b) => a - b);
}

export function privilegiosDesdeRol(privilegioIds: number[]): Set<number> {
  return new Set(privilegioIds);
}

export function formatearNombrePrivilegio(nombre: string): string {
  return nombre
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
