import { create } from 'zustand';
import { AuthState, User } from '../types';
import { authService } from '../services/authService';

interface AuthActions {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUserFromStorage: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login({ username, password });
      
      if (response.success && response.data) {
        const { access_token, user } = response.data;
        localStorage.setItem('webarco_auth_token', access_token);
        localStorage.setItem('webarco_user', JSON.stringify(user));
        
        set({
          user,
          token: access_token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        set({
          isLoading: false,
          error: response.message || 'Error al iniciar sesión',
        });
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Error de conexión con el servidor',
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } catch (err) {
      // Continue logout on client even if server call fails
      console.error('Logout request failed', err);
    } finally {
      localStorage.removeItem('webarco_auth_token');
      localStorage.removeItem('webarco_user');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  loadUserFromStorage: () => {
    const token = localStorage.getItem('webarco_auth_token');
    const userStr = localStorage.getItem('webarco_user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        set({
          token,
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (e) {
        // Corrupted localStorage
        localStorage.removeItem('webarco_auth_token');
        localStorage.removeItem('webarco_user');
        set({ token: null, user: null, isAuthenticated: false });
      }
    }
  },

  clearError: () => set({ error: null }),
}));
export default useAuthStore;
