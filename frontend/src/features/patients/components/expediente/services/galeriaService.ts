import api from '../../../../../services/api';
import { ApiResponse } from '../../../../../types/api';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type FotoCategoria = 'Antes' | 'Después' | 'Comparativa';

export const FOTO_CATEGORIAS: FotoCategoria[] = ['Antes', 'Después', 'Comparativa'];

export type FotoGaleria = {
  id_archivo: number;
  id_consulta: number;
  nombre: string;
  url: string;
  categoria: string;
  consulta?: {
    fecha_inicio: string;
    fecha_fin?: string | null;
    motivo?: string | null;
  };
};

export type SubirFotoPayload = {
  file: File;
  categoria: FotoCategoria;
  nombre?: string;
  id_consulta: number;
};

// ─── Servicio ─────────────────────────────────────────────────────────────────

export const galeriaService = {
  /** Obtiene todos los archivos del expediente de un paciente. */
  getByPaciente: async (pacienteId: number): Promise<ApiResponse<FotoGaleria[]>> => {
    return api.get(`/expediente-clinico/${pacienteId}/archivos`);
  },

  /** Sube una foto/archivo a una consulta específica (multipart/form-data). */
  subirFoto: async (
    pacienteId: number,
    payload: SubirFotoPayload
  ): Promise<ApiResponse<FotoGaleria>> => {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('categoria', payload.categoria);
    formData.append('nombre', payload.nombre ?? payload.file.name);
    formData.append('id_consulta', String(payload.id_consulta));
    return api.post(`/expediente-clinico/${pacienteId}/archivos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** Elimina un archivo del expediente por ID. */
  eliminarFoto: async (
    pacienteId: number,
    archivoId: number
  ): Promise<ApiResponse<void>> => {
    return api.delete(`/expediente-clinico/${pacienteId}/archivos/${archivoId}`);
  },
};
