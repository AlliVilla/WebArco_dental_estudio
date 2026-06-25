// types/consentimiento.ts

// Basado en model Persona
export interface Paciente {
  id_persona: number;
  numero_identidad: string;
  primer_nombre: string;
  segundo_nombre: string | null;
  primer_apellido: string;
  segundo_apellido: string | null;
  telefono: string;
  correo_electronico: string | null;
  fecha_nacimiento: string;
  sexo: 'M' | 'F';
  enfermedades: string | null;
  otras_enfermedades: string | null;
  medicamentos: string | null;
  alergias: string | null;
  reaccion_anestesia: string | null;
  direccion_linea: string | null;
  id_municipio: number;
}

// Basado en model Usuario (solo campos expuestos por el select)
export interface DoctorBasico {
  id_usuario: number;
  username: string;
  nombre: string;
}

export interface DoctorConNombre extends DoctorBasico {
  persona: {
    primer_nombre: string;
    segundo_nombre: string | null;
    primer_apellido: string;
    segundo_apellido: string | null;
  };
}

export type EstadoFirmas = 'completo' | 'pendiente' | 'incompleto';

// Basado en model Consulta — campos que devuelve findAll
export interface Consentimiento {
  id_consulta: number;
  fecha: string;                  // fecha_inicio serializado
  tratamiento: string | null;
  consentimiento: boolean;
  tiene_firma_paciente: boolean;  // calculado en el service
  tiene_firma_doctor: boolean;    // calculado en el service
  estado_firmas: EstadoFirmas;    // calculado en el service
  paciente: Paciente;
  doctor: DoctorBasico;
}

// Basado en model Consulta — campos que devuelve findOne (include: persona completa)
export interface ConsentimientoDetalle {
  id_consulta: number;
  id_cita: number | null;
  id_persona: number;
  id_usuario: number;
  fecha_inicio: string;
  fecha_fin: string | null;
  diagnostico: string | null;
  tratamiento: string | null;
  motivo: string | null;
  notas: string | null;
  firma_paciente: string | null;
  firma_doctor_snapshot: string | null;
  consentimiento: boolean;
  tratamientoPacienteId: number | null;
  // Calculados
  estado_firmas: EstadoFirmas;
  tiene_firma_paciente: boolean;
  tiene_firma_doctor: boolean;
  // Relaciones incluidas
  persona: Paciente;
  doctor: DoctorConNombre;
}

// Basado en lo que devuelve imprimir()
export interface ConsentimientoImpresion {
  consulta_id: number;
  fecha: string;
  diagnostico: string | null;
  tratamiento: string | null;
  paciente: {
    identidad: string;
    nombre_completo: string;
    telefono: string;
  };
  doctor: {
    nombre: string;
    firma: string | null;        // firma_doctor_snapshot
  };
  firma_paciente: string | null;
  consentimiento_aceptado: boolean;
  estado_firmas: EstadoFirmas;
}

// Basado en lo que devuelve getStats()
export interface ConsentimientoStats {
  total: number;
  completos: number;
  pendientes: number;
  incompletos: number;
  pendingCount: number;          // alias de pendientes
  alerta_global: boolean;
}

// Paginación — estructura devuelta por findAll
export interface PaginatedConsentimientos {
  data: Consentimiento[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Query params — basado en QueryConsentimientoDto
export interface QueryConsentimientoParams {
  page?: number;
  limit?: number;
  paciente?: string;             // busca en nombre e identidad
  tratamiento?: string;
  estado?: 'completo' | 'pendiente' | 'incompleto';
  doctor?: number;               // id_usuario
  mes?: number;                  // 1-12
  anio?: number;
}

// Body de POST — basado en CreateConsentimientoDto
export interface CreateConsentimientoInput {
  id_paciente: number;           // → id_persona en Consulta
  id_doctor: number;             // → id_usuario en Consulta
  fecha: string;                 // ISO string → fecha_inicio
  tipo_tratamiento: string;      // → tratamiento
  diagnostico?: string;
  firma_paciente?: string;       // URL o base64 inicial
  firma_doctor?: string;         // URL o base64 inicial
}

export interface UsuarioDoctor {
  id_usuario: number;
  username: string;
  primer_nombre: string;
  segundo_nombre?: string | null;
  primer_apellido: string;
  segundo_apellido?: string | null;
  sexo: 'M' | 'F';
  firma: string | null;
}