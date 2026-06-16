import api from '../../../services/api';
import type {
  NotificacionesResponse,
  ConfiguracionNotificaciones,
} from '../types';
import type { ApiResponse } from '../../../types/api';

export const notificationService = {
  getNotificaciones: async (
    page = 1,
    limit = 10,
    order: 'asc' | 'desc' = 'desc',
  ): Promise<ApiResponse<NotificacionesResponse>> => {
    return api.get('/notificaciones', { params: { page, limit, order } });
  },

  markAsRead: async (id: number): Promise<ApiResponse<unknown>> => {
    return api.patch(`/notificaciones/${id}/read`);
  },

  markAllAsRead: async (): Promise<ApiResponse<unknown>> => {
    return api.patch('/notificaciones/read-all');
  },

  getConfig: async (): Promise<ApiResponse<ConfiguracionNotificaciones>> => {
    return api.get('/notificaciones/config');
  },

  updateConfig: async (
    config: Pick<ConfiguracionNotificaciones, 'minutos_anticipacion' | 'email_notificaciones'>,
  ): Promise<ApiResponse<ConfiguracionNotificaciones>> => {
    return api.put('/notificaciones/config', config);
  },
};
