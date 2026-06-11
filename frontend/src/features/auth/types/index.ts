export interface Role {
  id: number;
  nombre: string;
}

export interface User {
  id_usuario: number;
  id_persona: number;
  username: string;
  password?: string;
  id_rol: number;
  firma?: string | null;
  activo?: boolean;
  must_change_password?: boolean;
  privilegios?: number[];
  rol?: Role;
  persona?: {
    id_persona?: number;
    numero_identidad?: string;
    primer_nombre: string;
    segundo_nombre?: string;
    primer_apellido: string;
    segundo_apellido?: string;
    fecha_nacimiento?: string;
    telefono?: string;
    correo_electronico?: string;
    id_municipio?: number;
    direccion_linea?: string;
    sexo?: string;
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
