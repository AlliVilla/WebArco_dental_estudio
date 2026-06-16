import api from '../../../services/api';
import type { ApiResponse } from '../../../types/api';

export type Departamento = {
  id_departamento: number;
  nombre: string;
};

export type Municipio = {
  id_municipio: number;
  nombre: string;
  id_departamento: number;
};

type DepartamentosResponse = {
  items: Departamento[];
  message?: string;
};

type MunicipiosResponse = {
  items: Municipio[];
  message?: string;
};

export const ubicacionService = {
  getDepartamentos: async (): Promise<ApiResponse<Departamento[]>> => {
    const response = await api.get('/departamento') as ApiResponse<DepartamentosResponse>;
    return {
      success: response.success,
      data: response.data.items,
      message: response.message,
    };
  },

  getMunicipiosPorDepartamento: async (idDepartamento: number): Promise<ApiResponse<Municipio[]>> => {
    const response = await api.get(`/municipio/departamento/${idDepartamento}`) as ApiResponse<MunicipiosResponse>;
    return {
      success: response.success,
      data: response.data.items,
      message: response.message,
    };
  },
};
