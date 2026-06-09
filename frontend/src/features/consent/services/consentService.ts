import api from '../../../services/api';
import { ApiResponse } from '../../../types/api';
import {
  ConsentTemplate,
  PatientConsent,
  ConsentimientoListResponse,
  ConsentimientoDetalle,
  ConsentimientoStats,
  CreateConsentimientoRequest,
  UpdateSignaturesRequest,
  QueryConsentimientoParams,
} from '../types';

export const consentService = {
  // ── Estadísticas ──
  getStats: async (): Promise<ApiResponse<ConsentimientoStats>> => {
    return api.get('/consents/stats');
  },

  // ── Listado y búsqueda ──
  getAll: async (params: QueryConsentimientoParams = {}): Promise<ApiResponse<ConsentimientoListResponse>> => {
    return api.get('/consents', { params });
  },

  // ── Obtener detalle ──
  getById: async (id: number): Promise<ApiResponse<ConsentimientoDetalle>> => {
    return api.get(`/consents/${id}`);
  },

  // ── Crear consentimiento ──
  create: async (data: CreateConsentimientoRequest): Promise<ApiResponse<ConsentimientoDetalle>> => {
    return api.post('/consents', data);
  },

  // ── Actualizar firmas ──
  updateSignatures: async (
    id: number,
    data: UpdateSignaturesRequest
  ): Promise<ApiResponse<ConsentimientoDetalle>> => {
    return api.patch(`/consents/${id}/signatures`, data);
  },

  // ── Firmar consentimiento (paciente) ──
  signAsPacient: async (
    consultaId: number,
    data: {
      firma_paciente: string;
      consentimiento: boolean;
    }
  ): Promise<ApiResponse<any>> => {
    return api.post(`/consentimiento/consulta/${consultaId}/firmar`, data);
  },

  // ── Obtener para impresión ──
  getPrintData: async (id: number): Promise<ApiResponse<ConsentimientoDetalle>> => {
    return api.get(`/consents/${id}/print`);
  },

  // ── Obtener templates (legales) ──
  getTemplates: async (): Promise<ApiResponse<ConsentTemplate[]>> => {
    return api.get('/consentimiento/templates');
  },

  getTemplateById: async (id: number): Promise<ApiResponse<ConsentTemplate>> => {
    return api.get(`/consentimiento/templates/${id}`);
  },

  // ── Obtener firmas por consulta ──
  getSignaturesByConsulta: async (consultaId: number): Promise<ApiResponse<PatientConsent[]>> => {
    return api.get(`/consentimiento/consulta/${consultaId}`);
  },
};

export default consentService;
