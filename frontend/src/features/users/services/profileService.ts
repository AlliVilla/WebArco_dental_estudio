import api from '../../../services/api';
import type { ApiResponse } from '../../../types/api';

export type ProfileResponse = {
  id_usuario: number;
  username: string;
  email: string | null;
  nombre: string;
  rol: string | null;
  message?: string;
};

export const profileService = {
  getProfile: async (): Promise<ProfileResponse> => {
    const response = await api.get('/usuario/profile') as ApiResponse<ProfileResponse>;
    return response.data;
  },

  updateProfile: async (data: {
    username: string;
    email: string;
    nombre_completo: string;
  }): Promise<ProfileResponse> => {
    const response = await api.put('/usuario/profile', data) as ApiResponse<ProfileResponse>;
    return response.data;
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> => {
    await api.put('/usuario/profile/change-password', data);
  },
};

export default profileService;