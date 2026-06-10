export type Rol = {
  id_rol: number;
  nombre: string;
};

export type Persona = {
  id_persona: number;
  numero_identidad: string;
  primer_nombre: string;
  segundo_nombre?: string | null;
  primer_apellido: string;
  segundo_apellido?: string | null;
  fecha_nacimiento: string;
  telefono: string;
  correo_electronico?: string | null;
  id_municipio: number;
  direccion_linea?: string | null;
  sexo: 'M' | 'F';
};

export type Usuario = {
  id_usuario: number;
  id_persona: number;
  username: string;
  id_rol: number;
  firma?: string | null;
  activo: boolean;
  must_change_password: boolean;
  persona: Persona;
  rol: Rol;
};

export type CreateUsuarioInput = {
  numero_identidad: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  fecha_nacimiento: string;
  telefono: string;
  correo_electronico?: string;
  id_departamento: number;
  id_municipio: number;
  direccion_linea?: string;
  sexo: 'M' | 'F';
  username: string;
  id_rol: number;
  password_temporal: string;
  firma?: string;
};

export type UpdateUsuarioInput = {
  numero_identidad?: string;
  primer_nombre?: string;
  segundo_nombre?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
  fecha_nacimiento?: string;
  telefono?: string;
  correo_electronico?: string;
  id_departamento?: number;
  id_municipio?: number;
  direccion_linea?: string;
  sexo?: 'M' | 'F';
  username?: string;
  id_rol?: number;
  firma?: string;
};

export type PaginatedUsuariosResponse = {
  usuarios: Usuario[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type UserStats = {
  total: number;
  doctores: number;
  especialistas: number;
};
