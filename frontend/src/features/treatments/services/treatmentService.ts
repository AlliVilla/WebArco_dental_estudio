import api from '../../../services/api';
import { TreatmentInput } from '../types';

export const treatmentService = {
  getAll: async (params?: { nombre?: string; especialidad?: string; activo?: string }) => {
    return api.get('/tratamiento', { params });
  },

  getById: async (id: number) => {
    return api.get(`/tratamiento/${id}`);
  },

  create: async (data: TreatmentInput) => {
    return api.post('/tratamiento', data);
  },

  update: async (id: number, data: Partial<TreatmentInput>) => {
    return api.put(`/tratamiento/${id}`, data);
  },

  delete: async (id: number) => {
    return api.delete(`/tratamiento/${id}`);
  },

  toggleActivo: async (id: number) => {
    return api.patch(`/tratamiento/${id}/toggle-activo`);
  },
};

export const especialidadService = {
  getAll: async () => {
    return api.get('/especialidad');
  },
  create: async (nombre: string) => {
    return api.post('/especialidad', { nombre });
  },
};
