import api from '../../../../services/api';
import { ApiResponse } from '../../../../types/api';
import { OdontogramItem } from '../types';

export const odontogramaService = {
  getByConsultaId: async (consultaId: number): Promise<ApiResponse<OdontogramItem[]>> => {
    return api.get(`/odontograma/consulta/${consultaId}`);
  },

  saveToothState: async (data: {
    id_consulta: number;
    id_diente: number;
    estado: string;
    observacion?: string;
  }): Promise<ApiResponse<OdontogramItem>> => {
    return api.post('/odontograma', data);
  },

  bulkSave: async (consultaId: number, items: Omit<OdontogramItem, 'id_odontograma'>[]): Promise<ApiResponse<OdontogramItem[]>> => {
    return api.post(`/odontograma/consulta/${consultaId}/bulk`, { items });
  },
};
export default odontogramaService;
