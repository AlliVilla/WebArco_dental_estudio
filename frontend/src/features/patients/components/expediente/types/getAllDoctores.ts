export interface GetDoctoresResponse {
  success: boolean;
  data: {
    data: UsuarioDoctor[];
    total: number;
  };
  message: string;
}

export interface Rol {
  id_rol: number;
  nombre: string;
}

export interface UsuarioDoctor {
  id_usuario: number;
  username: string;
  firma: string | null;
  rol: Rol;
  fullName: string;
  id_persona: number;
  primer_nombre: string;
  segundo_nombre?: string | null;
  primer_apellido: string;
  segundo_apellido?: string | null;
  telefono: string;
  correo_electronico: string;
  sexo: Sexo;
}

export type Sexo = 'M' | 'F';