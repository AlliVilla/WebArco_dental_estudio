import { api } from '../../../services/api';
import type { ApiResponse } from '../../../types/api';
import type {
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

  // ── Obtener para impresión ──
  getPrintData: async (id: number): Promise<ApiResponse<ConsentimientoDetalle>> => {
    return api.get(`/consents/${id}/print`);
  },
};