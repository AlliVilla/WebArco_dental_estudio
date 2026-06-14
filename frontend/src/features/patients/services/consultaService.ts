import api from '../../../services/api';
import type { ApiResponse } from '../../../types/api';

interface ConsultaPersona {
  id_persona: number;
  primer_nombre: string;
  segundo_nombre?: string | null;
  primer_apellido: string;
  segundo_apellido?: string | null;
}

interface ConsultaDoctor {
  id_usuario: number;
  persona: {
    primer_nombre: string;
    primer_apellido: string;
  };
}

export interface Consulta {
  id_consulta: number;
  diagnostico?: string | null;
  tratamiento?: string | null;
  persona: ConsultaPersona;
  doctor: ConsultaDoctor;
}

interface ConsultaListItem {
  id_consulta: number;
  diagnostico: string | null;
  tratamiento: string | null;
  fecha_inicio: string;
  doctor: {
    id_usuario: number;
    username: string;
    persona: { primer_nombre: string; primer_apellido: string };
  };
}

export const consultaService = {
  getById: async (id: number): Promise<ApiResponse<Consulta>> => {
    return api.get(`/consulta/${id}`);
  },

  getByPersona: async (idPersona: number): Promise<ApiResponse<{ data: ConsultaListItem[]; pagination: { total: number; page: number; limit: number; pages: number } }>> => {
    return api.get('/consulta', { params: { id_persona: idPersona, limit: 100 } });
  },
};
