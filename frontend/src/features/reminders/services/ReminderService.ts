import { api } from '../../../services/api';
import type { ApiResponse, RecordatorioRow, HistorialConfirmacionRow, SendReminderPayload, ReminderAppointmentOption } from '../types';

// ─── Flag de mock ─────────────────────────────────────────────────────────────
// Cambiar a false cuando el backend de recordatorios esté disponible

const USE_MOCK = true;

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_QUEUE: RecordatorioRow[] = [
  {
    id: 1,
    id_cita: 101,
    paciente: 'María González',
    contacto: '+504 3311-2244',
    canal: 'WhatsApp',
    hora_cita: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // +3h → urgente
    estado_envio: 'Pendiente',
    es_proximas_24h: true,
  },
{
  id: 2,
  id_cita: 102,
  paciente: 'Carlos Vega',
  contacto: '+504 9455-1234',
  canal: 'SMS',
  hora_cita: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // +6h → urgente
  estado_envio: 'Pendiente',
  es_proximas_24h: true,
},
{
  id: 3,
  id_cita: 103,
  paciente: 'Ana López',
  contacto: 'ana.lopez@example.com',
  canal: 'Correo',
  hora_cita: new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString(), // +30h
  estado_envio: 'Enviado',
  es_proximas_24h: false,
},
{
  id: 4,
  id_cita: 104,
  paciente: 'Roberto Hernández',
  contacto: '+504 8877-3322',
  canal: 'WhatsApp',
  hora_cita: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // +48h
  estado_envio: 'Error',
  es_proximas_24h: false,
},
{
  id: 5,
  id_cita: 105,
  paciente: 'Sofía Martínez',
  contacto: '+504 9900-1122',
  canal: 'SMS',
  hora_cita: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(), // +10h → urgente
  estado_envio: 'Pendiente',
  es_proximas_24h: true,
},
];

const MOCK_HISTORIAL: HistorialConfirmacionRow[] = [
  {
    id: 1,
    id_cita: 90,
    paciente: 'María González',
    fecha_envio: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    fecha_respuesta: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
    respuesta: 'Confirmó',
    canal: 'WhatsApp',
  },
{
  id: 2,
  id_cita: 91,
  paciente: 'Carlos Vega',
  fecha_envio: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  fecha_respuesta: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
  respuesta: 'Canceló',
  canal: 'SMS',
},
{
  id: 3,
  id_cita: 92,
  paciente: 'Ana López',
  fecha_envio: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  fecha_respuesta: null,
  respuesta: 'Sin respuesta',
  canal: 'Correo',
},
{
  id: 4,
  id_cita: 93,
  paciente: 'Roberto Hernández',
  fecha_envio: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  fecha_respuesta: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
  respuesta: 'Confirmó',
  canal: 'WhatsApp',
},
{
  id: 5,
  id_cita: 94,
  paciente: 'Sofía Martínez',
  fecha_envio: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  fecha_respuesta: null,
  respuesta: 'Sin respuesta',
  canal: null,
},
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function mockResponse<T>(data: T): Promise<ApiResponse<T>> {
  return new Promise((resolve) =>
  setTimeout(() => resolve({ success: true, data, message: 'OK' }), 400)
  );
}


export const ReminderService = {
  getQueue: (): Promise<ApiResponse<RecordatorioRow[]>> =>
  USE_MOCK ? mockResponse(MOCK_QUEUE) : api.get('/reminders/queue'),

  getHistorial: (): Promise<ApiResponse<HistorialConfirmacionRow[]>> =>
  USE_MOCK ? mockResponse(MOCK_HISTORIAL) : api.get('/reminders/history'),


  send: (payload: SendReminderPayload): Promise<ApiResponse<RecordatorioRow>> => {
    if (USE_MOCK) {
      const nuevo: RecordatorioRow = {
        id: Date.now(),
        id_cita: payload.id_cita,
        paciente: 'Paciente nuevo',
        contacto: '—',
        canal: payload.canal,
        hora_cita: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        estado_envio: 'Enviado',
        es_proximas_24h: false,
      };
      return mockResponse(nuevo);
    }
    return api.post('/reminders/send', payload);
  },

  retry: (id: number): Promise<ApiResponse<RecordatorioRow>> => {
    if (USE_MOCK) {
      const fila = MOCK_QUEUE.find((r) => r.id === id);
      return mockResponse({ ...(fila ?? MOCK_QUEUE[0]), estado_envio: 'Enviado' });
    }
    return api.post(`/reminders/${id}/retry`);
  },

  exportCsv: (): void => {
    if (USE_MOCK) {
      console.info('[Mock] exportCsv — conecta el backend para activar la descarga real.');
      return;
    }
    const base = (import.meta as any).env?.VITE_API_URL ?? '';
    window.open(`${base}/reminders/export`, '_blank');
  },

  getAppointments: async (): Promise<ApiResponse<ReminderAppointmentOption[]>> => {
    if (USE_MOCK) {
      return mockResponse([
        {
          id: 101,
          paciente: 'María González',
          fecha_hora: new Date().toISOString(),
        },
        {
          id: 102,
          paciente: 'Carlos Vega',
          fecha_hora: new Date().toISOString(),
        },
        {
          id: 103,
          paciente: 'Ana López',
          fecha_hora: new Date().toISOString(),
        },
      ]);
    }

    const res = await api.get('/appointments');

    return {
      ...res,
      data:
      res.data?.data?.map((cita: any) => ({
        id: cita.id,
        paciente:
        cita.paciente?.nombre_completo ??
        cita.paciente?.nombre ??
        `Paciente #${cita.id_persona}`,
        fecha_hora: cita.fecha_hora,
      })) ?? [],
    };
  },

};

