import api from '../../../services/api';
import type { ApiResponse } from '../../../types/api';
import type { CreateRoleInput, RoleSummary, UpdateRoleInput } from '../types';

type BackendRoleRecord = {
  id_rol: number;
  nombre: string;
  descripcion?: string | null;
  _count?: {
    usuarios?: number;
  };
};

type BackendRoleListResponse = {
  data: BackendRoleRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

function mapRole(role: BackendRoleRecord): RoleSummary {
  return {
    id_rol: role.id_rol,
    nombre: role.nombre,
    descripcion: role.descripcion ?? '',
    usuariosActivos: role._count?.usuarios ?? 0,
  };
}

export const roleService = {
  getAll: async (): Promise<ApiResponse<RoleSummary[]>> => {
    const response = await api.get('/rol', {
      params: {
        page: 1,
        limit: 100,
      },
    }) as ApiResponse<BackendRoleListResponse>;

    return {
      success: response.success,
      data: response.data.data.map(mapRole),
      message: response.message,
    };
  },

  create: async (data: CreateRoleInput): Promise<ApiResponse<RoleSummary>> => {
    const response = await api.post('/rol', data) as ApiResponse<BackendRoleRecord>;

    return {
      success: response.success,
      data: mapRole(response.data),
      message: response.message,
    };
  },

  update: async (id: number, data: UpdateRoleInput): Promise<ApiResponse<RoleSummary>> => {
    const response = await api.put(`/rol/${id}`, data) as ApiResponse<BackendRoleRecord>;

    return {
      success: response.success,
      data: mapRole(response.data),
      message: response.message,
    };
  },

  remove: async (id: number): Promise<ApiResponse<{ id_rol: number }>> => {
    const response = await api.delete(`/rol/${id}`) as ApiResponse<{ id_rol: number }>;

    return {
      success: response.success,
      data: {
        id_rol: response.data.id_rol,
      },
      message: response.message,
    };
  },
};

export default roleService;
