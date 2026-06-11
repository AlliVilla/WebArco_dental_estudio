import api from '../../../../../services/api';
import { ApiResponse } from '../../../../../types/api';

export interface RegistrarVisitaPayload {
  id_usuario: number;
  fecha_inicio: string;
  fecha_fin?: string;
  diagnostico?: string;
  tratamiento?: string;
  notas_adicionales?: string;
  firma_paciente?: string;
  firma_doctor?: string;
}

export const expedientService = {
    getAll: async (params?: Record<string, unknown>): Promise<ApiResponse> => {
        return api.get('/persona', { params });
    },
    registrarVisita: async (patientId: number, payload: RegistrarVisitaPayload): Promise<ApiResponse> => {
        return api.post(`/expediente-clinico/${patientId}/visits`, payload);
    },
};