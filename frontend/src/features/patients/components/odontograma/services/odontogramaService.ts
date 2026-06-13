import api from '../../../../../services/api';
import { ApiResponse } from '../../../../../types/api';
import {
  OdontogramaResponse,
  OdontogramaHistoryResponse,
  SaveToothResponse,
  BulkSaveResponse,
} from '../types';

export const odontogramaService = {
  getByPatientId: async (patientId: number): Promise<ApiResponse<OdontogramaResponse>> => {
    return api.get(`/odontograma/${patientId}`);
  },

  getHistory: async (patientId: number): Promise<ApiResponse<OdontogramaHistoryResponse>> => {
    return api.get(`/odontograma/${patientId}/history`);
  },

  getToothHistory: async (patientId: number, toothNumber: number): Promise<ApiResponse<OdontogramaHistoryResponse>> => {
    return api.get(`/odontograma/${patientId}/tooth/${toothNumber}/history`);
  },

  saveToothState: async (
    patientId: number,
    toothNumber: number,
    estado: string,
    observacion?: string,
  ): Promise<ApiResponse<SaveToothResponse>> => {
    return api.patch(`/odontograma/${patientId}/tooth/${toothNumber}`, {
      estado,
      observacion: observacion || null,
    });
  },

  bulkSave: async (
    consultaId: number,
    items: Array<{ id_diente: number; estado: string; observacion?: string }>,
  ): Promise<ApiResponse<BulkSaveResponse>> => {
    return api.post(`/odontograma/consulta/${consultaId}/bulk`, { items });
  },

  getActiveConsultationPatients: async (): Promise<ApiResponse<any[]>> => {
    return api.get('/odontograma/consulta/activas');
  },
};

export default odontogramaService;
