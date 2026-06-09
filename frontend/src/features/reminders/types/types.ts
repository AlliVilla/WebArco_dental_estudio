export type CanalRecordatorio = 'WhatsApp' | 'SMS' | 'Correo';

export type EstadoEnvio = 'Pendiente' | 'Enviado' | 'Error';

export interface RecordatorioRow {
  id: number;
  id_cita: number;
  paciente: string;
  contacto: string;
  canal: CanalRecordatorio;
  hora_cita: string;       // ISO string
  estado_envio: EstadoEnvio;
  es_proximas_24h: boolean;
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
