import api from '../../../../../services/api';
import { ApiResponse } from '../../../../../types/api';

export interface TratamientoPayload {
  id_tratamiento: number;
  precio: number;
  descuento?: number;
}

export interface RegistrarConsultaPayload {
  id_usuario: number;
  fecha_inicio: string;
  fecha_fin?: string;
  motivo?: string;
  diagnostico?: string;
  tratamiento?: string;
  notas_adicionales?: string;
  firma_paciente?: string;
  firma_doctor?: string;
  tratamientos?: TratamientoPayload[];
  respuestas?: RespuestaConsulta[];
}

export interface PreguntaConsulta {
  id_pregunta: number;
  pregunta: string;
  orden_num: number;
  requiere_explicacion: boolean;
  categoria: string;
}

export interface RespuestaConsulta {
  id_pregunta: number;
  respuestaBoolean?: boolean;
  explanation?: string;
}

export const expedientService = {
    getAll: async (params?: Record<string, unknown>): Promise<ApiResponse> => {
        return api.get('/persona', { params });
    },
    registrarConsulta: async (patientId: number, payload: RegistrarConsultaPayload): Promise<ApiResponse> => {
        return api.post(`/expediente-clinico/${patientId}/visits`, payload);
    },
    getPreguntas: async (): Promise<ApiResponse<PreguntaConsulta[]>> => {
        return api.get('/consulta-pregunta');
    },
    crearPregunta: async (data: { pregunta: string; orden_num: number; requiere_explicacion: boolean; categoria: string }): Promise<ApiResponse<{ id_pregunta: number }>> => {
        return api.post('/consulta-pregunta', data);
    },
    updatePregunta: async (id: number, data: Partial<{ pregunta: string; orden_num: number; requiere_explicacion: boolean; categoria: string }>): Promise<ApiResponse<PreguntaConsulta>> => {
        return api.patch(`/consulta-pregunta/${id}`, data);
    },
    deletePregunta: async (id: number): Promise<ApiResponse<PreguntaConsulta>> => {
        return api.delete(`/consulta-pregunta/${id}`);
    },
    saveRespuestas: async (consultaId: number, respuestas: RespuestaConsulta[]): Promise<ApiResponse> => {
        return api.post(`/consulta/${consultaId}/respuestas`, respuestas);
    },
};

