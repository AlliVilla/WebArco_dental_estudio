import api from '../../../../../services/api';
import { ApiResponse } from '../../../../../types/api';
import {
  OdontogramaResponse,
  OdontogramaHistoryResponse,
  SaveToothResponse,
  BulkSaveResponse,
} from '../types';

const STATE_MAP: Record<string, string> = {
  sano: 'Sano',
  caries: 'Caries',
  obturacion: 'Obturación',
  extraccion: 'Extracción',
  ausente: 'Ausente',
  endodoncia: 'Endodoncia',
  corona: 'Corona',
  protesis: 'Prótesis',
  implante: 'Implante',
  puente: 'Puente',
};

const STATE_MAP_REVERSE: Record<string, string> = {
  Sano: 'sano',
  Caries: 'caries',
  'Obturación': 'obturacion',
  Extracción: 'extraccion',
  Ausente: 'ausente',
  Endodoncia: 'endodoncia',
  Corona: 'corona',
  Prótesis: 'protesis',
  Implante: 'implante',
  Puente: 'puente',
};

export function mapToBackendState(state: string): string {
  return STATE_MAP[state] || state;
}

export function mapToFrontendState(state: string): string {
  return STATE_MAP_REVERSE[state] || state;
}

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
      estado: mapToBackendState(estado),
      observacion: observacion || null,
    });
  },

  bulkSave: async (
    consultaId: number,
    items: Array<{ id_diente: number; estado: string; observacion?: string }>,
  ): Promise<ApiResponse<BulkSaveResponse>> => {
    const mappedItems = items.map(item => ({
      id_diente: item.id_diente,
      estado: mapToBackendState(item.estado),
      observacion: item.observacion || null,
    }));
    return api.post(`/odontograma/consulta/${consultaId}/bulk`, { items: mappedItems });
  },

  getActiveConsultationPatients: async (): Promise<ApiResponse<any[]>> => {
    return api.get('/odontograma/consulta/activas');
  },
};

export default odontogramaService;
