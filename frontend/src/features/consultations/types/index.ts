import { Patient } from '../../patients/types';
import { User } from '../../auth/types';

export interface Consultation {
  id_consulta: number;
  id_cita?: number;
  id_persona: number;
  id_usuario: number; // Doctor's User ID
  fecha_inicio: string;
  fecha_fin?: string;
  diagnostico?: string;
  tratamiento?: string;
  motivo?: string;
  notas?: string;
  firma_paciente?: string;
  firma_doctor_snapshot?: string;
  consentimiento: boolean;
  
  persona?: Patient;
  doctor?: User;
}

export interface CreateConsultationInput {
  id_cita?: number;
  id_persona: number;
  id_usuario: number;
  fecha_inicio: string;
  motivo?: string;
  notas?: string;
}
