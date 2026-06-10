import api from '../../../services/api';
import type { ApiResponse } from '../../../types/api';
import type {
  CreateUsuarioInput,
  PaginatedUsuariosResponse,
  UpdateUsuarioInput,
  UserStats,
  Usuario,
} from '../types';

type UsuarioStatsResponse = UserStats & {
  message?: string;
};

type UpdateStatusResponse = {
  id_usuario: number;
  username: string;
  activo: boolean;
  message?: string;
};

export const userService = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    nombre?: string;
    correo?: string;
    rol?: string;
  }): Promise<ApiResponse<PaginatedUsuariosResponse>> => {
    return api.get('/usuario/all', {
      params,
    }) as Promise<ApiResponse<PaginatedUsuariosResponse>>;
  },

  getStats: async (): Promise<ApiResponse<UserStats>> => {
    const response = await api.get('/usuario/stats') as ApiResponse<UsuarioStatsResponse>;

    return {
      success: response.success,
      data: {
        total: response.data.total,
        doctores: response.data.doctores,
        especialistas: response.data.especialistas,
      },
      message: response.message,
    };
  },

  create: async (data: CreateUsuarioInput): Promise<ApiResponse<Usuario>> => {
    return api.post('/usuario', data) as Promise<ApiResponse<Usuario>>;
  },

  update: async (id: number, data: UpdateUsuarioInput): Promise<ApiResponse<Usuario>> => {
    return api.put(`/usuario/${id}`, data) as Promise<ApiResponse<Usuario>>;
  },

  updateStatus: async (
    id: number,
    activo: boolean,
  ): Promise<ApiResponse<{ id_usuario: number; username: string; activo: boolean }>> => {
    const response = await api.patch(`/usuario/${id}/status`, { activo }) as ApiResponse<UpdateStatusResponse>;

    return {
      success: response.success,
      data: {
        id_usuario: response.data.id_usuario,
        username: response.data.username,
        activo: response.data.activo,
      },
      message: response.message,
    };
  },
};

export default userService;
