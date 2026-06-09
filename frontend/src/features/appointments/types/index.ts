import { User } from '../../auth/types';

export type EstadoCita = 'programada' | 'confirmada' | 'atendida' | 'cancelada' | 'ausente' | 'reprogramada';

export interface CitaPersona {
  id_persona: number;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  numero_identidad: string;
  telefono: string;
}

export interface CitaDoctor {
  id_usuario: number;
  username: string;
  persona: {
    primer_nombre: string;
    primer_apellido: string;
  };
}

export interface Appointment {
  id_cita: number;
  id_persona: number;
  id_usuario: number;
  fecha_inicio: string;
  fecha_fin?: string;
  tipo_cita?: string;
  motivo?: string;
  estado: EstadoCita;
  notas?: string;
  persona?: CitaPersona;
  doctor?: CitaDoctor;
  historial_estados?: StatusChange[];
}

export interface StatusChange {
  id_historial: number;
  estado_anterior?: EstadoCita;
  estado_nuevo: EstadoCita;
  fecha_cambio: string;
  cambiado_por: number;
  usuario?: { 
    id_usuario: number; 
    username: string; 
    persona?: { 
      primer_nombre: string; 
      primer_apellido: string;
    };
  };
}

export interface CreateAppointmentInput {
  id_persona: number;
  id_usuario: number;
  fecha_inicio: string;
  fecha_fin?: string;
  tipo_cita?: string;
  motivo?: string;
  notas?: string;
  estado?: EstadoCita;
}

export interface UpdateAppointmentInput extends Partial<CreateAppointmentInput> {}
