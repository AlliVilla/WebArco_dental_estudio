import { api } from '../../../services/api';
import { API_URL } from '../../../config/constants';
import type {
  ApiResponse,
  RecordatorioRow,
  HistorialConfirmacionRow,
  SendReminderPayload,
  ReminderAppointmentOption,
} from '../types';

// ─── Tipos de respuesta del backend ───────────────────────────────────────────

interface PersonaBackend {
  id_persona: number;
  primer_nombre: string;
  segundo_nombre?: string | null;
  primer_apellido: string;
  segundo_apellido?: string | null;
  telefono: string;
  correo_electronico?: string | null;
}

interface CitaBackend {
  id_cita: number;
  fecha_inicio: string;
  estado: string;
  persona?: PersonaBackend;
}

interface RecordatorioBackend {
  id: number;
  id_cita: number;
  canal: 'WhatsApp' | 'Correo';
  estado_respuesta: 'pendiente' | 'confirmado' | 'cancelado' | 'sin_respuesta' | 'descartado';
  fecha_envio: string;
  fecha_respuesta?: string | null;
  cita?: CitaBackend;
}

interface QueueBackendResponse {
  pendientes_envio: CitaBackend[];
  esperando_respuesta: RecordatorioBackend[];
}

// El backend devuelve historial paginado: { records, total, page, limit, totalPages }
interface HistorialBackendResponse {
  records: RecordatorioBackend[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Helpers de mapeo ─────────────────────────────────────────────────────────

function buildNombre(p?: PersonaBackend): string {
  if (!p) return 'Paciente desconocido';
  return [p.primer_nombre, p.segundo_nombre, p.primer_apellido, p.segundo_apellido]
    .filter(Boolean)
    .join(' ');
}

function buildContacto(p: PersonaBackend | undefined, canal: 'WhatsApp' | 'Correo'): string {
  if (!p) return 'Sin contacto';
  if (canal === 'WhatsApp') return p.telefono;
  return p.correo_electronico || p.telefono;
}

function isProximas24h(fecha_iso: string): boolean {
  const cita = new Date(fecha_iso);
  const now = new Date();
  const diffHours = (cita.getTime() - now.getTime()) / (1000 * 60 * 60);
  return diffHours >= 0 && diffHours <= 24;
}

function mapQueueToRows(data: QueueBackendResponse): RecordatorioRow[] {
  // Citas sin recordatorio → Pendiente de envío
  const dePendientes: RecordatorioRow[] = (data.pendientes_envio ?? []).map(
    (cita) => ({
      id: `cita-${cita.id_cita}`,   // id temporal – la cita aún no tiene recordatorio
      id_cita: cita.id_cita,
      paciente: buildNombre(cita.persona),
      contacto: buildContacto(cita.persona, 'WhatsApp'),
      canal: 'WhatsApp' as const,  // canal por defecto; el form de envío lo define
      hora_cita: cita.fecha_inicio,
      estado_envio: 'Pendiente' as const,
      es_proximas_24h: isProximas24h(cita.fecha_inicio),
    }),
  );

  // Recordatorios enviados esperando respuesta del paciente → Enviado
  const deEnviados: RecordatorioRow[] = (data.esperando_respuesta ?? []).map(
    (rec) => ({
      id: `rec-${rec.id}`,
      id_cita: rec.id_cita,
      paciente: buildNombre(rec.cita?.persona),
      contacto: buildContacto(rec.cita?.persona, rec.canal),
      canal: rec.canal,
      hora_cita: rec.cita?.fecha_inicio ?? rec.fecha_envio,
      estado_envio: 'Enviado' as const,
      es_proximas_24h: isProximas24h(rec.cita?.fecha_inicio ?? rec.fecha_envio),
      respuesta: mapRespuesta(rec.estado_respuesta),
    }),
  );

  return [...dePendientes, ...deEnviados];
}

// Mapea estado_respuesta del backend → RespuestaPaciente del frontend
function mapRespuesta(
  estado: RecordatorioBackend['estado_respuesta'],
): HistorialConfirmacionRow['respuesta'] {
  if (estado === 'confirmado') return 'Confirmó';
  if (estado === 'cancelado') return 'Canceló';
  if (estado === 'descartado') return 'Descartado';
  return 'Sin respuesta';
}

function mapHistorialToRows(data: HistorialBackendResponse): HistorialConfirmacionRow[] {
  return (data.records ?? []).map((rec) => ({
    id: rec.id,
    id_cita: rec.id_cita,
    paciente: buildNombre(rec.cita?.persona),
    fecha_envio: rec.fecha_envio,
    fecha_respuesta: rec.fecha_respuesta ?? null,
    respuesta: mapRespuesta(rec.estado_respuesta),
    canal: rec.canal ?? null,
  }));
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

export const ReminderService = {
  getQueue: async (): Promise<ApiResponse<RecordatorioRow[]>> => {
    const res: ApiResponse<QueueBackendResponse> = await api.get('/reminders/queue');
    return {
      ...res,
      data: mapQueueToRows(
        res.data ?? { pendientes_envio: [], esperando_respuesta: [] },
      ),
    };
  },

  // Bug fix: el backend devuelve { records, total, page, limit, totalPages }, no un array.
  // El ResponseInterceptor lo envuelve en data, así que response.data es ese objeto.
  getHistorial: async (): Promise<ApiResponse<HistorialConfirmacionRow[]>> => {
    const res: ApiResponse<HistorialBackendResponse> = await api.get('/reminders/history', {
      params: { limit: 100 },
    });
    return {
      ...res,
      data: mapHistorialToRows(
        res.data ?? { records: [], total: 0, page: 1, limit: 100, totalPages: 0 },
      ),
    };
  },

  send: async (payload: SendReminderPayload): Promise<ApiResponse<RecordatorioRow>> => {
    return api.post('/reminders/send', payload);
  },

  retry: async (id: number): Promise<ApiResponse<void>> => {
    return api.post(`/reminders/cola-envio/reintentar/${id}`);
  },

  discardReminder: async (id: string | number): Promise<ApiResponse<void>> => {
    return api.patch(`/reminders/${id}/discard`);
  },

  registerResponse: async (
    id: number,
    payload: { respuesta: 'Confirmo' | 'Cancelo'; cambiado_por: number }
  ): Promise<ApiResponse<any>> => {
    return api.patch(`/reminders/${id}/response`, payload);
  },


  exportCsv: (): void => {
    const base = API_URL;
    window.open(`${base}/reminders/export`, '_blank');
  },

  // Bug fix: GET /appointments requiere start y end obligatorios (retorna 400 sin ellos).
  // Se usa una ventana amplia de 2 años para traer todas las citas disponibles.
  getAppointments: async (): Promise<ApiResponse<ReminderAppointmentOption[]>> => {
    const now = new Date();
    const start = new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
    const end   = new Date(now.getFullYear() + 1, 11, 31).toISOString().split('T')[0];

    const res: ApiResponse<{ data: CitaBackend[] }> = await api.get('/appointments', {
      params: { start, end },
    });
    return {
      ...res,
      data: (res.data?.data ?? [])
        .filter((cita: CitaBackend) => cita.estado === 'programada')
        .map((cita: CitaBackend) => ({
          id: cita.id_cita,
          paciente: buildNombre(cita.persona),
          fecha_hora: cita.fecha_inicio,
        })),
    };
  },
};
