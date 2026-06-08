import api from '../../../services/api';
import { ApiResponse } from '../../../types/api';
import { Consultation, CreateConsultationInput } from '../types';

export const consultationService = {
  getAll: async (params?: Record<string, any>): Promise<ApiResponse<Consultation[]>> => {
    return api.get('/consulta', { params });
  },

  getById: async (id: number): Promise<ApiResponse<Consultation>> => {
    return api.get(`/consulta/${id}`);
  },

  getByPatientId: async (patientId: number): Promise<ApiResponse<Consultation[]>> => {
    return api.get(`/consulta/paciente/${patientId}`);
  },

  create: async (data: CreateConsultationInput): Promise<ApiResponse<Consultation>> => {
    return api.post('/consulta', data);
  },

  update: async (id: number, data: Partial<Consultation>): Promise<ApiResponse<Consultation>> => {
    return api.put(`/consulta/${id}`, data);
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    return api.delete(`/consulta/${id}`);
  },
};
export default consultationService;
