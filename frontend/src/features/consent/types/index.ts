export interface ConsentTemplate {
  id: number;
  titulo: string;
  contenido: string; // The legal text template
  activo: boolean;
}

export interface PatientConsent {
  id_consentimiento: number;
  id_consulta: number;
  firmado: boolean;
  firma_imagen?: string; // Base64 signature
  fecha_firma: string;
  paciente_nombre: string;
}
