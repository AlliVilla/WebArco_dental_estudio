import { api } from '../../../services/api';
import type { ApiResponse, RecordatorioRow, HistorialConfirmacionRow, SendReminderPayload } from '../types';

export const ReminderService = {
  getQueue: (): Promise<ApiResponse<RecordatorioRow[]>> =>
  api.get('/reminders/queue'),

  getHistorial: (): Promise<ApiResponse<HistorialConfirmacionRow[]>> =>
  api.get('/reminders/history'),

  send: (payload: SendReminderPayload): Promise<ApiResponse<RecordatorioRow>> =>
  api.post('/reminders/send', payload),

  retry: (id: number): Promise<ApiResponse<RecordatorioRow>> =>
  api.post(`/reminders/${id}/retry`),

  exportCsv: (): void => {
    const base = (import.meta as any).env?.VITE_API_URL ?? '';
    window.open(`${base}/reminders/export`, '_blank');
  },
};

