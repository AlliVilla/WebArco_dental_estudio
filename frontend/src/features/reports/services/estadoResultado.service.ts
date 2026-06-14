import api from '../../../services/api';
import type { ApiResponse } from '../../../types/api';
import { EstadoResultadoResponse} from '../types/estadoResultado';

export const finanzasService = {
    getEstadoResultado: async(fecha_inicio: Date, fecha_fin: Date) => {
        const res  = await api.get<ApiResponse<EstadoResultadoResponse>>(
            '/finanzas/estado-resultado',
            { params: {fecha_inicio, fecha_fin} }
        );

        return res;
    }
};