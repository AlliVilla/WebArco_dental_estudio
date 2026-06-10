import api from '../../../services/api';
import type { ApiResponse } from '../../../types/api';
import type { Privilegio } from '../types';

export const privilegeService = {
  getAll: async (): Promise<ApiResponse<Privilegio[]>> => {
    const response = await api.get('/privilegio') as ApiResponse<Privilegio[]>;

    return {
      success: response.success,
      data: response.data,
      message: response.message,
    };
  },
};

export default privilegeService;
