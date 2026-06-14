import api from '../../../services/api';
import { ApiResponse } from '../../../types/api';
import {
  PatientPayment,
  CreatePaymentInput,
  UpdatePaymentInput,
  FinancialRecord,
  CreateExpenseInput,
  ExpenseMetricResponse,
  ExpenseSummaryResponse,
  CierreHistorialResponse,
  TipoCierre,
} from '../types';

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

  getExpenses: async (): Promise<ApiResponse<FinancialRecord[]>> => {
    return api.get('/egreso');
  },

  getExpenseById: async (id: number): Promise<ApiResponse<FinancialRecord>> => {
    return api.get(`/egreso/${id}`);
  },

  getExpenseSummary: async (): Promise<ApiResponse<ExpenseSummaryResponse>> => {
    return api.get('/egreso/resumen');
  },

  getExpensesMonth: async (): Promise<ApiResponse<ExpenseMetricResponse>> => {
    return api.get('/egreso/mes');
  },

  getExpensesDay: async (): Promise<ApiResponse<ExpenseMetricResponse>> => {
    return api.get('/egreso/dia');
  },

  getExpensesAverageMonth: async (): Promise<ApiResponse<ExpenseMetricResponse>> => {
    return api.get('/egreso/promedio-mes');
  },

  createExpense: async (data: CreateExpenseInput): Promise<ApiResponse<FinancialRecord>> => {
    return api.post('/egreso', data);
  },

  updateExpense: async (
    id: number,
    data: CreateExpenseInput,
  ): Promise<ApiResponse<FinancialRecord>> => {
    return api.put(`/egreso/${id}`, data);
  },

  deleteExpense: async (id: number): Promise<ApiResponse<unknown>> => {
    return api.delete(`/egreso/${id}`);
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

  getCierreHistorial: async (): Promise<ApiResponse<CierreHistorialResponse>> => {
    return api.get('/cierre');
  },

  createCierre: async (tipo: TipoCierre = 'Diario'): Promise<ApiResponse<{ cierre: CierreHistorialResponse[0] }>> => {
    return api.post('/cierre', null, { params: { tipo } });
  },

  previewCierre: async (tipo: TipoCierre = 'Diario'): Promise<ApiResponse<{
    totalIngresos: number;
    totalEgresos: number;
    utilidad: number;
    efectivo: number;
    tarjeta: number;
    transferencia: number;
    fecha: string;
    tipoCierre: TipoCierre;
  }>> => {
    return api.post('/cierre/preview', null, { params: { tipo } });
  },
};

export default billingService;
