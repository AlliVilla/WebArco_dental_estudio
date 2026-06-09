import api from '../../../services/api';
import { ApiResponse } from '../../../types/api';
import { User } from '../types';

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export const authService = {
  login: async (credentials: Record<string, string>): Promise<ApiResponse<LoginResponse>> => {
    return api.post('/auth/login', credentials);
  },

  logout: async (): Promise<ApiResponse<null>> => {
    return api.post('/auth/logout');
  },

  forgotPassword: async (email: string): Promise<ApiResponse<null>> => {
    return api.post('/auth/forgot-password', { email });
  },

  resetPassword: async (data: Record<string, string>): Promise<ApiResponse<null>> => {
    return api.put('/auth/reset-password', data);
  },

  refresh: async (): Promise<ApiResponse<{ access_token: string }>> => {
    return api.post('/auth/refresh');
  },
};
