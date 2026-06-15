export type DashboardAppointmentStatus =
  | 'programada'
  | 'confirmada'
  | 'cancelada'
  | 'atendida'
  | 'ausente'
  | 'reprogramada';

export interface DashboardKpiValue {
  value: number;
  sub: string;
}

export interface DashboardAppointment {
  id: number;
  time: string;
  patient: string;
  treatment: string;
  status: DashboardAppointmentStatus;
  avatar: string;
}

export interface DashboardWeekData {
  day: string;
  citas: number;
  atendidas: number;
}

export interface DashboardRevenueData {
  month: string;
  monto: number;
}

export interface DashboardGeneralSummary {
  fecha: string;
  kpis: {
    citasHoy: DashboardKpiValue;
    pacientesActivos: DashboardKpiValue;
    consultasMes: DashboardKpiValue;
    pendientesHoy: DashboardKpiValue;
  };
  citasSemana: DashboardWeekData[];
  agendaHoy: DashboardAppointment[];
}

export interface DashboardFinancialSummary {
  fecha: string;
  kpis: {
    ingresosMes: DashboardKpiValue;
  };
  ingresosPorMes: DashboardRevenueData[];
}
