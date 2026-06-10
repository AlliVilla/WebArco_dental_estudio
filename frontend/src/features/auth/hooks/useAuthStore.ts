import { create } from 'zustand';
import { AuthState } from '../types';
import { authService } from '../services/authService';

interface AuthActions {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

function loadInitialState(): Pick<AuthState, 'user' | 'token' | 'isAuthenticated'> {
  const token = localStorage.getItem('webarco_auth_token');
  const userStr = localStorage.getItem('webarco_user');
  if (token && userStr) {
    try {
      return { user: JSON.parse(userStr), token, isAuthenticated: true };
    } catch {
      localStorage.removeItem('webarco_auth_token');
      localStorage.removeItem('webarco_user');
    }
  }
  return { user: null, token: null, isAuthenticated: false };
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  ...loadInitialState(),
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
    } catch (error: unknown) {
      let message = 'Error de conexión con el servidor';
      if (error && typeof error === 'object' && 'message' in error) {
        message = (error as { message: string }).message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      set({ isLoading: false, error: message });
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

  clearError: () => set({ error: null }),
}));
export default useAuthStore;
