// services/consentimientoService.ts

import api from '../../../services/api';
import { ApiResponse } from '../../../types/api';
import {
  Consentimiento,
  ConsentimientoDetalle,
  ConsentimientoImpresion,
  ConsentimientoStats,
  PaginatedConsentimientos,
  QueryConsentimientoParams,
  CreateConsentimientoInput,
} from '../types/consentimiento';

export const consentimientoService = {
  /** GET /consents/stats */
  getStats: async (): Promise<ApiResponse<ConsentimientoStats>> => {
    return api.get('/consents/stats');
  },

  /** GET /consents */
  getAll: async (
    params?: QueryConsentimientoParams,
  ): Promise<ApiResponse<PaginatedConsentimientos>> => {
    return api.get('/consents', { params });
  },

  /** GET /consents/:id */
  getById: async (id: number): Promise<ApiResponse<ConsentimientoDetalle>> => {
    return api.get(`/consents/${id}`);
  },

  /** GET /consents/:id/print */
  getForPrint: async (id: number): Promise<ApiResponse<ConsentimientoImpresion>> => {
    return api.get(`/consents/${id}/print`);
  },

  /** POST /consents */
  create: async (
    data: CreateConsentimientoInput,
  ): Promise<ApiResponse<ConsentimientoDetalle>> => {
    return api.post('/consents', data);
  },

  /**
   * PATCH /consents/:id/signatures
   * Multer espera multipart/form-data con campos firma_paciente y/o firma_doctor
   */
  updateSignatures: async (
    id: number,
    signatures: {
      firma_paciente?: File | string;
      firma_doctor?: File | string;
    },
  ): Promise<ApiResponse<ConsentimientoDetalle>> => {
    // Verificamos si hay algún archivo real. Si no, enviamos JSON.
    const hasFile = signatures.firma_paciente instanceof File || signatures.firma_doctor instanceof File;

    if (!hasFile) {
      return api.patch(`/consents/${id}/signatures`, {
        firma_paciente: signatures.firma_paciente || undefined,
        firma_doctor: signatures.firma_doctor || undefined,
      });
    }

    const formData = new FormData();
    if (signatures.firma_paciente) formData.append('firma_paciente', signatures.firma_paciente);
    if (signatures.firma_doctor) formData.append('firma_doctor', signatures.firma_doctor);
    
    return api.patch(`/consents/${id}/signatures`, formData);
  },

  /**
   * Convierte un data URL de canvas (base64) a File
   * para usarlo con updateSignatures cuando se captura firma en el frontend.
   *
   * @example
   * const file = consentimientoService.canvasToFile(
   *   canvasRef.current.toDataURL('image/png'),
   *   `firma-paciente-${Date.now()}.png`
   * );
   * await consentimientoService.updateSignatures(id, { firma_paciente: file });
   */
  canvasToFile: (dataUrl: string, filename: string): File => {
    const [header, base64] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png';
    const bytes = atob(base64);
    const buffer = new Uint8Array(bytes.length);

    for (let i = 0; i < bytes.length; i++) {
      buffer[i] = bytes.charCodeAt(i);
    }

    return new File([buffer], filename, { type: mime });
  },
};

export default consentimientoService;