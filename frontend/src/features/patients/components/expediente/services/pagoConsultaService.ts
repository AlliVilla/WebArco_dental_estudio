import api from '../../../../../services/api';
import { ApiResponse } from '../../../../../types/api';

export interface AbonoDistribucionInput {
  tratamientoPacienteId: number;
  montoAbonado: number;
}

export interface CreatePagoConsultaInput {
  consultaId: number;
  monto: number;
  metodoPago: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA';
  observacion?: string;
  abonos: AbonoDistribucionInput[];
}

export interface TratamientoAbono {
  id: number;
  pagoConsultaId: number;
  tratamientoPacienteId: number;
  montoAbonado: number;
  tratamientoPaciente?: { id: number; nombre: string; costoTotal: number };
}

export interface PagoConsultaResponse {
  id: number;
  consultaId: number;
  monto: number;
  metodoPago: string;
  fecha: string;
  observacion?: string | null;
  abonos?: TratamientoAbono[];
}

export interface EstadoFinancieroItem {
  id: number;
  nombre: string;
  costoTotal: number;
  totalPagado: number;
  saldoPendiente: number;
  estado: string;
  fechaInicio: string;
  fechaFin?: string | null;
}

export const pagoConsultaService = {
  create: async (data: CreatePagoConsultaInput): Promise<ApiResponse<PagoConsultaResponse>> => {
    return api.post('/pago-consulta', data);
  },

  findByConsulta: async (consultaId: number): Promise<ApiResponse<PagoConsultaResponse[]>> => {
    return api.get(`/pago-consulta/consulta/${consultaId}`);
  },

  getEstadoFinanciero: async (pacienteId: number): Promise<ApiResponse<EstadoFinancieroItem[]>> => {
    return api.get(`/pago-consulta/estado-financiero/paciente/${pacienteId}`);
  },
};
