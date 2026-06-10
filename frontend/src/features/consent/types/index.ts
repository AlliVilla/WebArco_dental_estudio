// Estados y tipos constantes
export type EstadoFirma = 'completo' | 'pendiente' | 'incompleto';

export type TipoTratamiento = 
  | 'Extracción dental'
  | 'Ortodoncia'
  | 'Implante dental'
  | 'Endodoncia (tratamiento de conducto)'
  | 'Blanqueamiento dental'
  | 'Cirugía oral'
  | 'Periodoncia'
  | 'Prótesis dental';

// ── Respuestas del backend ──

export type ConsentimientoListItem = {
  id_consulta: number;
  fecha: string;
  tratamiento: string;
  consentimiento: boolean;
  tiene_firma_paciente: boolean;
  tiene_firma_doctor: boolean;
  estado_firmas: EstadoFirma;
  paciente: {
    id_persona: number;
    numero_identidad: string;
    primer_nombre: string;
    segundo_nombre: string | null;
    primer_apellido: string;
    segundo_apellido: string | null;
  };
  doctor: {
    id_usuario: number;
    username: string;
  };
};

export type ConsentimientoDetalle = {
  id_consulta: number;
  fecha_inicio: string;
  tratamiento: string;
  diagnostico: string | null;
  consentimiento: boolean;
  firma_paciente: string | null;
  firma_doctor_snapshot: string | null;
  estado_firmas: EstadoFirma;
  tiene_firma_paciente: boolean;
  tiene_firma_doctor: boolean;
  persona: {
    id_persona: number;
    numero_identidad: string;
    primer_nombre: string;
    segundo_nombre: string | null;
    primer_apellido: string;
    segundo_apellido: string | null;
  };
  doctor: {
    id_usuario: number;
    username: string;
    persona: {
      primer_nombre: string;
      segundo_nombre: string | null;
      primer_apellido: string;
      segundo_apellido: string | null;
    };
  };
};

export type ConsentimientoStats = {
  total: number;
  completos: number;
  pendientes: number;
  incompletos: number;
  pendingCount: number;
  alerta_global: boolean;
};

export type ConsentimientoListResponse = {
  data: ConsentimientoListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// ── DTOs para requests ──

export type CreateConsentimientoRequest = {
  id_paciente: number;
  id_doctor: number;
  tipo_tratamiento: string;
  fecha: string;
  diagnostico?: string;
  firma_paciente?: string;
  firma_doctor?: string;
};

export type UpdateSignaturesRequest = {
  firma_paciente?: string;
  firma_doctor?: string;
};

export type QueryConsentimientoParams = {
  page?: number;
  limit?: number;
  paciente?: string;
  tratamiento?: string;
  estado?: EstadoFirma;
  doctor?: number;
  mes?: number;
  anio?: number;
};

// ── Tipos legales (templates) ──

export type ConsentTemplate = {
  id: number;
  titulo: string;
  contenido: string;
  activo: boolean;
};

export type PatientConsent = {
  id_consentimiento: number;
  id_consulta: number;
  firmado: boolean;
  firma_imagen?: string;
  fecha_firma: string;
  paciente_nombre: string;
};
