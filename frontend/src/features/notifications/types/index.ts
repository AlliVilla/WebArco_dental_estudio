export type TipoNotificacion = 'cita_proxima' | 'cita_confirmada' | 'cita_cancelada';

export interface NotificacionCita {
  id_cita: number;
  fecha_inicio: string;
  tipo_cita: string | null;
  motivo: string | null;
  estado: string;
  persona: {
    primer_nombre: string;
    segundo_nombre: string | null;
    primer_apellido: string;
    segundo_apellido: string | null;
    telefono: string;
  } | null;
}

export interface Notificacion {
  id: number;
  id_usuario: number;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  id_cita: number | null;
  leida: boolean;
  created_at: string;
  cita: NotificacionCita | null;
}

export interface NotificacionesResponse {
  notificaciones: Notificacion[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

export interface ConfiguracionNotificaciones {
  id_usuario: number;
  minutos_anticipacion: number;
  email_notificaciones: boolean;
}
