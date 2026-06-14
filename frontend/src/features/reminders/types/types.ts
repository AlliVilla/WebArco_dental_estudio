export type CanalRecordatorio = 'WhatsApp' | 'Correo';

export type EstadoEnvio = 'Pendiente' | 'Enviado' | 'Error';

export type RespuestaPaciente = 'Confirmó' | 'Canceló' | 'Sin respuesta' | 'Descartado';

export interface ReminderAppointmentOption {
  id: number;
  paciente: string;
  fecha_hora: string;
}

export interface RecordatorioRow {
  id: string;
  id_cita: number;
  paciente: string;
  contacto: string;
  canal: CanalRecordatorio;
  hora_cita: string;       // ISO string
  estado_envio: EstadoEnvio;
  es_proximas_24h: boolean;
  respuesta?: RespuestaPaciente;
}

export interface HistorialConfirmacionRow {
  id: number;
  id_cita: number;
  paciente: string;
  fecha_envio: string;             // ISO string
  fecha_respuesta: string | null;  // null = sin respuesta
  respuesta: RespuestaPaciente;
  canal: CanalRecordatorio | null; // null = integración no disponible
}


export interface SendReminderPayload {
  id_cita: number;
  canal: CanalRecordatorio;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
