import { create } from "zustand";
import type { AuthState, User } from "../types";
import { authService } from "../services/authService";

interface AuthActions {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateUser: (user: User) => void;
}

function loadInitialState(): Pick<
  AuthState,
  "user" | "token" | "isAuthenticated"
> {
  const token = localStorage.getItem("webarco_auth_token");
  const userStr = localStorage.getItem("webarco_user");
  if (token && userStr) {
    try {
      const { password: _password, ...user } = JSON.parse(userStr);
      localStorage.setItem("webarco_user", JSON.stringify(user));
      return { user, token, isAuthenticated: true };
    } catch {
      localStorage.removeItem("webarco_auth_token");
      localStorage.removeItem("webarco_user");
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
      const payload = response.data || (response as any);

      if (
        response.success !== false &&
        payload &&
        payload.access_token &&
        payload.user
      ) {
        const { access_token, user } = payload;
        localStorage.setItem("webarco_auth_token", access_token);
        localStorage.setItem("webarco_user", JSON.stringify(user));

        set({
          user,
          token: access_token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        const defaultMsg = "Error al iniciar sesión";
        let errMsg = response.message || defaultMsg;
        const lowerMsg = errMsg.toLowerCase();
        if (
          lowerMsg.includes("exitos") ||
          lowerMsg.includes("exitosa") ||
          lowerMsg.includes("éxito")
        ) {
          errMsg = defaultMsg; // Evita mostrar un mensaje de éxito como error si falta algo en la data
        }
        set({
          isLoading: false,
          error: errMsg,
        });
      }
    } catch (error: unknown) {
      let message = "Error de conexión con el servidor";
      if (error && typeof error === "object" && "message" in error) {
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
      console.error("Logout request failed", err);
    } finally {
      localStorage.removeItem("webarco_auth_token");
      localStorage.removeItem("webarco_user");
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

  updateUser: (user: User) => {
    localStorage.setItem("webarco_user", JSON.stringify(user));
    set({ user });
  },
}));
export default useAuthStore;
