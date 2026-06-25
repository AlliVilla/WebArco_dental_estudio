export interface ConsultaHistorica {
  id_consulta: number;
  id_persona: number;
  id_usuario: number;
  doctor: Doctor;
  fecha_inicio: string;
  fecha_fin?: string | null;
  diagnostico?: string | null;
  tratamiento?: string | null;
  motivo?: string | null;
  notas?: string | null;
  firma_paciente?: string | null;
  firma_doctor_snapshot?: string | null;
  consentimiento: boolean;
  estado_firmas?: {
    firma_paciente_presente: boolean;
    firma_doctor_presente: boolean;
    firmas_completas: boolean;
    pendientes: string[];
  };
  tratamientos: ConsultaTratamiento [];
  archivos: Archivo[];
  respuestas?: {
    id_respuesta: number;
    id_consulta: number;
    id_pregunta: number;
    respuesta_boolean?: boolean | null;
    explanation?: string | null;
    pregunta?: {
      id_pregunta: number;
      pregunta: string;
      orden_num: number;
    };
  }[];
}

export type Doctor = {
  id_usuario: number;
  username: string;
  firma: string | null;
  persona: Persona;
}

export type Persona = {
  id_persona: number;
  primer_nombre: string;
  primer_apellido: string;
  sexo: 'M' | 'F';
}

export type Archivo = {
  id_archivo: number;
  id_consulta: number;
  nombre: string;
  url: string;
  categoria: string;
}

export interface TratamientoPacienteExp {
  id: number;
  nombre: string;
  costoTotal: number;
  totalAbonado: number;
  saldoPendiente: number;
  estado: string;
  fechaInicio: string;
  fechaFin?: string | null;
  consultas?: ConsultaHistorica[];
}

export type ExpedientePaciente = {
  id_persona: number;
  primer_nombre: string;
  segundo_nombre: string | null;
  primer_apellido: string;
  segundo_apellido: string | null;
  numero_identidad: string;
  fecha_nacimiento: string;
  telefono: string | null;
  correo_electronico: string | null;
  direccion_linea: string | null;
  sexo: string;
  enfermedades?: string | null;
  medicamentos?: string | null;
  alergias?: string | null;
  consultas: ConsultaHistorica[];
  tratamientos?: TratamientoPacienteExp[];
  municipio: {
    id_municipio: number;
    nombre: string;
    departamento: {
      id_departamento: number;
      nombre: string;
    };
  }
};

export type ConsultaTratamiento = {
  id_consulta_tratamiento: number;
  id_tratamiento: number;
  id_consulta: number;
  descuento: number;
  precio: number;
  tratamiento : Tratamiento;
};

export type Tratamiento = {
  id_tratamiento: number;
  nombre: string;
  descripcion: string;
  precio: number;
}

export type ExpedientePacienteResponse = {
  data: ExpedientePaciente[];
  pagination: {
    limit: number,
    page: number,
    pages: number,
    total: number,
  }
}

