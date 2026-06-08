export type ToothCondition = 'SANO' | 'CARIES' | 'RESTAURADO' | 'AUSENTE' | 'CORONA' | 'IMPLANTE' | 'EXTRACCION';

export interface ToothSurfaceState {
  superior: ToothCondition; // Vestibular/Palatino
  inferior: ToothCondition; // Lingual/Vestibular
  izquierda: ToothCondition; // Mesial/Distal
  derecha: ToothCondition; // Distal/Mesial
  centro: ToothCondition; // Oclusal/Incisal
}

export interface OdontogramItem {
  id_odontograma?: number;
  id_consulta: number;
  id_diente: number;
  estado: string; // Serialized ToothCondition or Surface conditions
  observacion?: string;
}

export interface Tooth {
  numero_diente: number;
  nombre: string;
  estado: ToothCondition;
  observacion?: string;
  superficies: ToothSurfaceState;
}
