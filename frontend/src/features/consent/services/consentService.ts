import api from '../../../services/api';
import { ApiResponse } from '../../../types/api';
import { ConsentTemplate, PatientConsent } from '../types';

export const consentService = {
  getTemplates: async (): Promise<ApiResponse<ConsentTemplate[]>> => {
    return api.get('/consentimiento/templates');
  },

  getTemplateById: async (id: number): Promise<ApiResponse<ConsentTemplate>> => {
    return api.get(`/consentimiento/templates/${id}`);
  },

  getSignaturesByConsulta: async (consultaId: number): Promise<ApiResponse<PatientConsent[]>> => {
    return api.get(`/consentimiento/consulta/${consultaId}`);
  },

  signConsent: async (consultaId: number, data: {
    firma_paciente: string;
    consentimiento: boolean;
  }): Promise<ApiResponse<any>> => {
    return api.post(`/consentimiento/consulta/${consultaId}/firmar`, data);
  },
};
export default consentService;
