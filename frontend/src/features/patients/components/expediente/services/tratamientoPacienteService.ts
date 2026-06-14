import api from '../../../../../services/api';
import { ApiResponse } from '../../../../../types/api';

export interface CreateTratamientoPacienteInput {
  pacienteId: number;
  nombre: string;
  costoTotal: number;
  fechaInicio: string;
  fechaFin?: string;
}

export interface TratamientoPacienteAbono {
  id: number;
  pagoConsultaId: number;
  tratamientoPacienteId: number;
  montoAbonado: number;
  pagoConsulta?: {
    id: number;
    monto: number;
    metodoPago: string;
    fecha: string;
    consulta?: { id_consulta: number; fecha_inicio: string };
  };
}

export interface TratamientoPacienteConsulta {
  id_consulta: number;
  fecha_inicio: string;
  fecha_fin?: string | null;
  notas?: string | null;
  doctor?: { id_usuario: number; username: string; persona: { primer_nombre: string; primer_apellido: string } };
  pagosConsulta?: { id: number; monto: number; metodoPago: string; fecha: string }[];
}

export interface TratamientoPacienteResponse {
  id: number;
  pacienteId: number;
  nombre: string;
  costoTotal: number;
  saldoPendiente: number;
  totalAbonado: number;
  estado: 'ACTIVO' | 'COMPLETADO' | 'CANCELADO';
  fechaInicio: string;
  fechaFin?: string | null;
  consultas?: TratamientoPacienteConsulta[];
  abonos?: TratamientoPacienteAbono[];
}

export const tratamientoPacienteService = {
  create: async (data: CreateTratamientoPacienteInput): Promise<ApiResponse<TratamientoPacienteResponse>> => {
    return api.post('/tratamiento-paciente', data);
  },

  findByPaciente: async (pacienteId: number): Promise<ApiResponse<TratamientoPacienteResponse[]>> => {
    return api.get(`/tratamiento-paciente/paciente/${pacienteId}`);
  },

  findOne: async (id: number): Promise<ApiResponse<TratamientoPacienteResponse>> => {
    return api.get(`/tratamiento-paciente/${id}`);
  },

  updateEstado: async (id: number, estado: string): Promise<ApiResponse<TratamientoPacienteResponse>> => {
    return api.patch(`/tratamiento-paciente/${id}/estado`, { estado });
  },
};
