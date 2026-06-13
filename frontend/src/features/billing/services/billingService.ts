import api from '../../../services/api';
import { ApiResponse } from '../../../types/api';
import { PatientPayment, CreatePaymentInput, UpdatePaymentInput } from '../types';

export interface PaginatedPayments {
  data: PatientPayment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const billingService = {
  getAll: async (params?: Record<string, any>): Promise<ApiResponse<PaginatedPayments>> => {
    return api.get('/pago-paciente', { params });
  },

  getByConsultaId: async (consultaId: number): Promise<ApiResponse<PatientPayment[]>> => {
    return api.get(`/pago-paciente/consulta/${consultaId}`);
  },

  create: async (data: CreatePaymentInput): Promise<ApiResponse<PatientPayment>> => {
    return api.post('/pago-paciente', data);
  },

  update: async (id: number, data: UpdatePaymentInput): Promise<ApiResponse<PatientPayment>> => {
    return api.patch(`/pago-paciente/${id}`, data);
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    return api.delete(`/pago-paciente/${id}`);
  },
};
export default billingService;
