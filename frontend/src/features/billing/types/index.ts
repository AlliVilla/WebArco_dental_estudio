export interface PatientPayment {
  id_pago: number;
  id_consulta: number;
  fecha: string;
  abono: number;
  observacion?: string;
  firma_paciente?: string;
  consulta?: {
    id_consulta: number;
    diagnostico?: string;
    tratamiento?: string;
    persona?: {
      nombre: string;
      apellido: string;
    };
  };
}

export interface CreatePaymentInput {
  id_consulta: number;
  fecha: string;
  abono: number;
  observacion?: string;
  firma_paciente?: string;
}
