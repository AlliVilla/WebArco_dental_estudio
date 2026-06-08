export interface Patient {
  id: number;
  nombre: string;
  apellido: string;
  identidad: string; // National ID number
  fecha_nacimiento: string;
  genero: 'M' | 'F' | 'OTRO';
  telefono?: string;
  correo?: string;
  direccion?: string;
  createdAt?: string;
}

export interface ClinicalRecord {
  id: number;
  id_paciente: number;
  codigo_expediente: string; // Unique clinic folder number
  grupo_sanguineo?: string;
  alergias?: string;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
  paciente?: Patient;
}

export interface MedicalHistoryAnswer {
  id: number;
  id_expediente: number;
  id_pregunta: number;
  respuesta: 'SI' | 'NO' | 'NO_SABE';
  detalles?: string;
  pregunta?: {
    id: number;
    descripcion: string;
  };
}
