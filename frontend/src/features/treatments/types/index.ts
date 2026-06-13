export interface Treatment {
  id: number;
  idEspecialidad: number;
  especialidad: string;
  nombre: string;
  descripcion?: string;
  impactoOdontograma: string;
  precio: number;
}

export type TreatmentInput = {
  idEspecialidad: number;
  nombre: string;
  descripcion?: string;
  impactoOdontograma: string;
  precio: number;
};

export interface Especialidad {
  id: number;
  nombre: string;
}

export const ESTADOS_ODONTOGRAMA = [
  "Sano",
  "Caries",
  "Obturación",
  "Extracción",
  "Ausente",
  "Endodoncia",
  "Corona",
  "Prótesis",
  "Implante",
  "Puente",
] as const;
