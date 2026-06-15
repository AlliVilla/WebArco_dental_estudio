export interface Treatment {
  id: number;
  idEspecialidad: number;
  especialidad: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  activo: boolean;
}

export type TreatmentInput = {
  idEspecialidad: number;
  nombre: string;
  descripcion?: string;
  precio: number;
};

export interface Especialidad {
  id: number;
  nombre: string;
}

