import api from '../../../services/api';
import { Treatment, TreatmentInput } from '../types';

export const treatmentService = {
  getAll: async (params?: { nombre?: string; especialidad?: string }) => {
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
};

export const especialidadService = {
  getAll: async () => {
    return api.get('/especialidad');
  },
};
