import api from '../../../services/api';
import { ApiResponse } from '../../../types/api';
import { Appointment, CreateAppointmentInput, UpdateAppointmentInput, StatusChange, PatientHistoryResponse } from '../types';

export const appointmentService = {
  getByCalendar: async (start: string, end: string, id_usuario?: number): Promise<ApiResponse<Appointment[]>> => {
    const res: ApiResponse<{ data: Appointment[] }> = await api.get('/appointments', { params: { start, end, id_usuario } });
    return { ...res, data: res.data?.data ?? [] };
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
    const res: ApiResponse<{ data: StatusChange[] }> = await api.get(`/appointments/${id}/status-history`);
    return { ...res, data: res.data?.data ?? [] };
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    return api.delete(`/appointments/${id}`);
  },

  getPatientHistory: async (patientId: number, params?: Record<string, unknown>): Promise<ApiResponse<PatientHistoryResponse>> => {
    return api.get(`/appointments/patient/${patientId}/history`, { params });
  },

  getPersonas: async (search?: string): Promise<ApiResponse<any[]>> => {
    const res: ApiResponse<{ data: any[] }> = await api.get('/persona', { params: { search } });
    return { ...res, data: res.data?.data ?? [] };
  },

  getUsuarios: async (): Promise<ApiResponse<any[]>> => {
    const res: ApiResponse<{ usuarios: any[] }> = await api.get('/usuario/all');
    return { ...res, data: res.data?.usuarios ?? [] };
  },
};
