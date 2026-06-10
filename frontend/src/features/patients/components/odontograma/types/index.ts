export type ToothState =
  | 'sano' | 'caries' | 'obturacion' | 'extraccion' | 'ausente'
  | 'endodoncia' | 'corona' | 'protesis' | 'implante' | 'puente';

export interface ToothData {
  number: number;
  state: ToothState;
  observation: string;
}

export interface HistoryEntry {
  id: number;
  toothNumber: number;
  previousState: ToothState | null;
  newState: ToothState;
  observation: string;
  doctor: string;
  date: string;
}

export interface OdontogramaResponse {
  paciente_id: number;
  total_dientes: number;
  total_dientes_con_registros: number;
  dientes: OdontogramaDiente[];
}

export interface OdontogramaDiente {
  numero_diente: number;
  nombre: string;
  estado: string;
  observacion: string | null;
  doctor: { id_usuario: number; nombre: string } | null;
  fecha_consulta: string | null;
  hasPreviousRecords: boolean;
  previousRecordsCount: number;
}

export interface OdontogramaHistoryResponse {
  paciente_id: number;
  total_registros: number;
  historial: OdontogramaHistorialItem[];
}

export interface OdontogramaHistorialItem {
  id_odontograma: number;
  id_consulta: number;
  diente: { numero_diente: number; nombre: string };
  estado: string;
  observacion: string | null;
  doctor: { id_usuario: number; nombre: string };
  fecha_consulta: string;
  fecha_fin: string | null;
}

export interface SaveToothResponse {
  message: string;
  id_odontograma: number;
  id_consulta: number;
  diente: { numero_diente: number; nombre: string };
  estado: string;
  observacion: string | null;
  doctor: { id_usuario: number; nombre: string };
  fecha_consulta: string;
}

export interface BulkSaveResponse {
  message: string;
  registros: SaveToothResponse[];
}
