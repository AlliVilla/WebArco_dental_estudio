import { api } from '../../../services/api';
import type { ApiResponse, RecordatorioRow, SendReminderPayload } from '../types';

export const ReminderService = {
  getQueue: (): Promise<ApiResponse<RecordatorioRow[]>> =>
    api.get('/reminders/queue'),

  send: (payload: SendReminderPayload): Promise<ApiResponse<RecordatorioRow>> =>
    api.post('/reminders/send', payload),

  retry: (id: number): Promise<ApiResponse<RecordatorioRow>> =>
    api.post(`/reminders/${id}/retry`),
};
