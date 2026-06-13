import api from '../../../../../services/api';

export interface EstadoOdontograma {
  id: number;
  nombre: string;
  color: string;
}

export const estadoOdontogramaService = {
  getAll: async () => {
    return api.get('/estado-odontograma');
  },

  create: async (nombre: string, color: string) => {
    return api.post('/estado-odontograma', { nombre, color });
  },

  update: async (id: number, nombre: string, color: string) => {
    return api.patch(`/estado-odontograma/${id}`, { nombre, color });
  },

  remove: async (id: number) => {
    return api.delete(`/estado-odontograma/${id}`);
  },
};
