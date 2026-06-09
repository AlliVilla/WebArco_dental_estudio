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

export type TransactionKind = 'income' | 'expense';

export type IncomePaymentMethod = 'Tarjeta' | 'Efectivo' | 'Transferencia';

export type ExpenseCategory = 'Insumos' | 'Equipos' | 'N\u00f3mina' | 'Servicios';

export interface FinancialRecord extends Record<string, unknown> {
  id: string;
  type: TransactionKind;
  date: string;
  patient?: string;
  concept: string;
  amount: number;
  paymentMethod?: IncomePaymentMethod;
  category?: ExpenseCategory;
  responsible?: string;
}
