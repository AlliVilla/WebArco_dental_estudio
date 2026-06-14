import api from '../../../services/api';
import { ApiResponse } from '../../../types/api';
import { PatientPayment, CreatePaymentInput } from '../types';

export const billingService = {
  getAll: async (params?: Record<string, any>): Promise<ApiResponse<PatientPayment[]>> => {
    return api.get('/pago-paciente', { params });
  },

  getByConsultaId: async (consultaId: number): Promise<ApiResponse<PatientPayment[]>> => {
    return api.get(`/pago-paciente/consulta/${consultaId}`);
  },

  create: async (data: CreatePaymentInput): Promise<ApiResponse<PatientPayment>> => {
    return api.post('/pago-paciente', data);
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    return api.delete(`/pago-paciente/${id}`);
  },

  getEstadoFinanciero: async (pacienteId: number): Promise<ApiResponse<any[]>> => {
    return api.get(`/pago-consulta/estado-financiero/paciente/${pacienteId}`);
  },

  createPagoConsulta: async (data: any): Promise<ApiResponse<any>> => {
    return api.post('/pago-consulta', data);
  },

  getPagosConsulta: async (consultaId: number): Promise<ApiResponse<any[]>> => {
    return api.get(`/pago-consulta/consulta/${consultaId}`);
  },
};
export default billingService;
