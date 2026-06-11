interface ConsultaHistorica {
  id_consulta: number;
  id_persona: number;
  id_usuario: number;
  fecha_inicio: string;
  fecha_fin?: string | null;
  diagnostico?: string | null;
  tratamiento?: string | null;
  motivo?: string | null;
  notas?: string | null;
  firma_paciente?: string | null;
  firma_doctor_snapshot?: string | null;
  consentimiento: boolean;
  tratamientos: ConsultaTratamiento [];
  archivos: Archivo[];
}

export type Archivo = {
  id_archivo: number;
  id_consulta: number;
  nombre: string;
  url: string;
  categoria: string;
}

export type ExpedientePaciente = {
  id_persona: number;
  nombre: string;
  primer_nombre: string;
  segundo_nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  numero_identidad: string;
  fecha_nacimiento: Date;
  telefono: string;
  correo_electronico: string;
  departamento: string;
  ciudad: string;
  direccion: string;
  sexo: 'M' | 'F';
  ultimaVisita: string;
  totalVisitas: number;
  antecedentes: string;
  enfermedadBase: string;
  tomaMedicamento: string;
  alergias: string;
  consultas: ConsultaHistorica[];
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