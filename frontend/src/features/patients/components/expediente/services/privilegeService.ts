import api from '../../../../../services/api';
import { ApiResponse } from '../../../../../types/api';

export const privilegeService = {
    getAllDoctores: async () : Promise<ApiResponse> => {
        return api.get('/privilegio/doctores');
    }
};