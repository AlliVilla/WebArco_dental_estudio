export interface PatientPayment {
  id_pago: number;
  id_consulta: number;
  fecha: string;
  abono: number;
  metodoPago: string;
  cuentaDestino?: string;
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
  cuentaDestino?: string;
  observacion?: string;
  firma_paciente?: string;
}

export type UpdatePaymentInput = Partial<CreatePaymentInput>;

export type TransactionKind = 'ingreso' | 'egreso';

export type IncomePaymentMethod = 'Tarjeta' | 'Efectivo' | 'Transferencia';

export type ExpenseCategory = 'Insumos' | 'Equipos' | 'Nómina' | 'Servicios';

export interface UserAudit {
  id_usuario: number;
  username: string;
  nombre_completo: string;
}

export interface FinancialRecord extends Record<string, unknown> {
  id_registro: string;
  tipo: TransactionKind;
  fecha: string;
  paciente?: string;
  concepto: string;
  monto: number;
  metodoPago?: IncomePaymentMethod;
  categoria?: ExpenseCategory;
  observaciones?: string | null;
  responsable?: string;
  creado_por?: UserAudit;
  modificado_por?: UserAudit | null;
}

export interface CreateExpenseInput {
  concepto: string;
  monto: number;
  categoria: ExpenseCategory;
  fecha: string;
  observaciones?: string;
  insumos?: { id_insumo: number; cantidad: number }[];
}

export interface ExpenseMetricResponse {
  total: number;
  registros: FinancialRecord[];
}

export interface ExpenseSummaryResponse {
  egresos_del_mes: ExpenseMetricResponse;
  egreso_del_dia: ExpenseMetricResponse;
  egreso_promedio: ExpenseMetricResponse;
}

export type TipoCierre = 'Diario' | 'Semanal' | 'Quincenal' | 'Mensual';

export interface CierreHistorialItem {
  id_cierre: number;
  fecha: string;
  tipo_cierre: TipoCierre;
  ingresos: number;
  egresos: number;
  utilidad: number;
  efectivo: number;
  tarjeta: number;
  transferencia: number;
  id_usuario: number;
  usuario: {
    username: string;
    persona: {
      primer_nombre: string;
      primer_apellido: string;
    } | null;
  } | null;
}

export type CierreHistorialResponse = CierreHistorialItem[];
