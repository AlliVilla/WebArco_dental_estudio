import api from '../../../services/api';
import { ApiResponse } from '../../../types/api';
import { Appointment, CreateAppointmentInput, UpdateAppointmentInput, StatusChange } from '../types';

export const appointmentService = {
  getByCalendar: async (start: string, end: string, id_usuario?: number): Promise<ApiResponse<Appointment[]>> => {
    return api.get('/appointments', { params: { start, end, id_usuario } });
  },

  getById: async (id: number): Promise<ApiResponse<Appointment>> => {
    return api.get(`/appointments/${id}`);
  },

  create: async (data: CreateAppointmentInput): Promise<ApiResponse<Appointment>> => {
    return api.post('/appointments', data);
  },

  update: async (id: number, data: UpdateAppointmentInput): Promise<ApiResponse<Appointment>> => {
    return api.put(`/appointments/${id}`, data);
  },

  changeStatus: async (id: number, estado: string, cambiado_por: number): Promise<ApiResponse<Appointment>> => {
    return api.patch(`/appointments/${id}/status`, { estado, cambiado_por });
  },

  getStatusHistory: async (id: number): Promise<ApiResponse<StatusChange[]>> => {
    return api.get(`/appointments/${id}/status-history`);
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    return api.delete(`/appointments/${id}`);
  },

  getPatientHistory: async (patientId: number, params?: any): Promise<ApiResponse<Appointment[]>> => {
    return api.get(`/appointments/patient/${patientId}/history`, { params });
  },

  // Helpers to get patients and doctors
  getPersonas: async (search?: string): Promise<ApiResponse<any[]>> => {
    return api.get('/persona', { params: { search } });
  },
  
  getUsuarios: async (): Promise<ApiResponse<any[]>> => {
    return api.get('/usuario');
  }
};
