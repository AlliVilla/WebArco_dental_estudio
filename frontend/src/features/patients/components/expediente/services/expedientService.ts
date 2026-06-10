import api from '../../../../../services/api';
import { ApiResponse } from '../../../../../types/api';
import { ExpedientePacienteResponse } from '../types/index';

export const expedientService = {
    getAll: async (params?: Record<string, unknown>): Promise<ApiResponse<ExpedientePacienteResponse>> => {
        return api.get('/persona', { params });
    },
};