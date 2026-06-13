export interface PatientPayment {
  id_pago: number;
  id_consulta: number;
  fecha: string;
  abono: number;
  metodoPago: string;
  estado: string;
  observacion?: string;
  firma_paciente?: string;
  consulta: {
    id_consulta: number;
    diagnostico?: string;
    tratamiento?: string;
    persona: {
      nombre: string;
      apellido: string;
    };
    doctor: {
      id_usuario: number;
      nombre: string;
    } | null;
  };
}

export interface CreatePaymentInput {
  id_consulta: number;
  fecha: string;
  abono: number;
  metodoPago?: string;
  observacion?: string;
  firma_paciente?: string;
}

export type TransactionKind = 'ingreso' | 'egreso';

export type IncomePaymentMethod = 'Tarjeta' | 'Efectivo' | 'Transferencia';

export type ExpenseCategory = 'Insumos' | 'Equipos' | 'Nómina' | 'Servicios';

export interface FinancialRecord extends Record<string, unknown> {
  id_registro: string;
  tipo: TransactionKind;
  fecha: string;
  paciente?: string;
  concepto: string;
  monto: number;
  metodoPago?: IncomePaymentMethod;
  categoria?: ExpenseCategory;
  responsable?: string;
}
