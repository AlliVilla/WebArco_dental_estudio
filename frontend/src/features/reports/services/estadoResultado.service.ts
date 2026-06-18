import api from '../../../services/api';
import type { ApiResponse } from '../../../types/api';
import type { EstadoResultadoResponse } from '../types/estadoResultado';

export const finanzasService = {
  getEstadoResultado: async (fecha_inicio: string, fecha_fin: string): Promise<ApiResponse<EstadoResultadoResponse>> => {
    return api.get('/finanzas/estado-resultado', {
      params: { fecha_inicio, fecha_fin },
    });
  },
};

export default finanzasService;
