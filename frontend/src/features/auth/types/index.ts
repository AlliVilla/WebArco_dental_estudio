export interface Role {
  id: number;
  nombre: string;
}

export interface User {
  id_usuario: number;
  id_persona: number;
  username: string;
  id_rol: number;
  rol?: Role;
  persona?: {
    nombre: string;
    apellido: string;
    telefono?: string;
    correo?: string;
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
