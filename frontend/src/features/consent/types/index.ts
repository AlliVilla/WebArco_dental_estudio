export type ConsentStatus = "firmado" | "pendiente_doctor" | "pendiente_paciente";
export type ConsentMode = "list" | "new" | "edit" | "preview";
export type ConsentStep = 1 | 2 | 3 | 4;
export type SignatureTarget = "patient" | "doctor";

export type ConsentRecord = Record<string, unknown> & {
  id: string;
  fecha: string;
  paciente: string;
  procedimiento: string;
  doctor: string;
  estado: ConsentStatus;
  hora: string;
  declaracion: string;
  riesgos: string;
  clausula: string;
  patientSignature?: string;
  doctorSignature?: string;
};

export type ConsentFormValues = {
  paciente: string;
  doctor: string;
  procedimiento: string;
  fechaHora: string;
  declaracion: string;
  riesgos: string;
  clausula: string;
};

export type ConsentSearchFilters = {
  paciente?: string;
  procedimiento?: string;
  doctor?: string;
  estado?: string;
};

export interface ConsentScreenProps {
  patientName?: string;
}