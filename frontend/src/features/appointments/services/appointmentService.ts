import api from '../../../services/api';
import { ApiResponse } from '../../../types/api';
import { Appointment, CreateAppointmentInput } from '../types';

export const appointmentService = {
  getAll: async (params?: Record<string, any>): Promise<ApiResponse<Appointment[]>> => {
    return api.get('/cita', { params });
  },

  getById: async (id: number): Promise<ApiResponse<Appointment>> => {
    return api.get(`/cita/${id}`);
  },

  create: async (data: CreateAppointmentInput): Promise<ApiResponse<Appointment>> => {
    return api.post('/cita', data);
  },

  update: async (id: number, data: Partial<CreateAppointmentInput>): Promise<ApiResponse<Appointment>> => {
    return api.put(`/cita/${id}`, data);
  },

  updateStatus: async (id: number, estado: string): Promise<ApiResponse<Appointment>> => {
    return api.patch(`/cita/${id}/estado`, { estado });
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    return api.delete(`/cita/${id}`);
  },
};
