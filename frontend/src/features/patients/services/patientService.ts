import api from '../../../services/api';
import { ApiResponse } from '../../../types/api';
import { Patient, ClinicalRecord, MedicalHistoryAnswer } from '../types';

export const patientService = {
  // Patients (Persona)
  getAll: async (params?: Record<string, unknown>): Promise<ApiResponse<Patient[]>> => {
    return api.get('/persona', { params });
  },

  getById: async (id: number): Promise<ApiResponse<Patient>> => {
    return api.get(`/persona/${id}`);
  },

  create: async (data: Omit<Patient, 'id'>): Promise<ApiResponse<Patient>> => {
    return api.post('/persona', data);
  },

  update: async (id: number, data: Partial<Patient>): Promise<ApiResponse<Patient>> => {
    return api.put(`/persona/${id}`, data);
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    return api.delete(`/persona/${id}`);
  },

  // Clinical Records (Expediente Clínico)
  getRecordByPatientId: async (patientId: number): Promise<ApiResponse<ClinicalRecord>> => {
    return api.get(`/expediente-clinico/paciente/${patientId}`);
  },

  createRecord: async (data: Omit<ClinicalRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<ClinicalRecord>> => {
    return api.post('/expediente-clinico', data);
  },

  updateRecord: async (id: number, data: Partial<ClinicalRecord>): Promise<ApiResponse<ClinicalRecord>> => {
    return api.put(`/expediente-clinico/${id}`, data);
  },

  // Medical History Answers (Antecedentes)
  getHistoryByRecordId: async (recordId: number): Promise<ApiResponse<MedicalHistoryAnswer[]>> => {
    return api.get(`/antecedente-pregunta/expediente/${recordId}`);
  },

  saveHistoryAnswers: async (recordId: number, answers: Omit<MedicalHistoryAnswer, 'id' | 'id_expediente'>[]): Promise<ApiResponse<null>> => {
    return api.post(`/antecedente-pregunta/expediente/${recordId}`, { answers });
  }
};
export default patientService;
