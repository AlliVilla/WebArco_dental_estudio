import { User } from '../../auth/types';

export type AppointmentStatus = 'PENDIENTE' | 'CONFIRMADA' | 'COMPLETADA' | 'CANCELADA';

export interface Appointment {
  id: number;
  fecha: string;
  motivo: string;
  estado: AppointmentStatus;
  id_paciente: number;
  id_usuario_doctor: number;
  observaciones?: string;
  paciente?: {
    nombre: string;
    apellido: string;
    telefono?: string;
    correo?: string;
  };
  doctor?: User;
}

export interface CreateAppointmentInput {
  fecha: string;
  motivo: string;
  id_paciente: number;
  id_usuario_doctor: number;
  observaciones?: string;
}
