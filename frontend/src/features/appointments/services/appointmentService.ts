import api from "../../../services/api";
import { ApiResponse } from "../../../types/api";
import {
  Appointment,
  CreateAppointmentInput,
  UpdateAppointmentInput,
  StatusChange,
  PatientHistoryResponse,
  PersonaRecord,
  UsuarioRecord,
} from "../types";

export const APPOINTMENTS_UPDATED_EVENT = "appointments-updated";

function notifyAppointmentsUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(APPOINTMENTS_UPDATED_EVENT));
  }
}

export const appointmentService = {
  getByCalendar: async (
    start: string,
    end: string,
    id_usuario?: number,
  ): Promise<ApiResponse<Appointment[]>> => {
    const res: ApiResponse<{ data: Appointment[] }> = await api.get(
      "/appointments",
      { params: { start, end, id_usuario } },
    );
    return { ...res, data: res.data?.data ?? [] };
  },

  getById: async (id: number): Promise<ApiResponse<Appointment>> => {
    return api.get(`/appointments/${id}`);
  },

  create: async (
    data: CreateAppointmentInput,
  ): Promise<ApiResponse<Appointment>> => {
    const res = await api.post<Appointment, ApiResponse<Appointment>>(
      "/appointments",
      data,
    );
    if (res.success) notifyAppointmentsUpdated();
    return res;
  },

  update: async (
    id: number,
    data: UpdateAppointmentInput,
  ): Promise<ApiResponse<Appointment>> => {
    const res = await api.put<Appointment, ApiResponse<Appointment>>(
      `/appointments/${id}`,
      data,
    );
    if (res.success) notifyAppointmentsUpdated();
    return res;
  },

  changeStatus: async (
    id: number,
    estado: string,
    cambiado_por: number,
  ): Promise<ApiResponse<Appointment>> => {
    const res = await api.patch<Appointment, ApiResponse<Appointment>>(
      `/appointments/${id}/status`,
      { estado, cambiado_por },
    );
    if (res.success) notifyAppointmentsUpdated();
    return res;
  },

  getStatusHistory: async (
    id: number,
  ): Promise<ApiResponse<StatusChange[]>> => {
    const res: ApiResponse<{ data: StatusChange[] }> = await api.get(
      `/appointments/${id}/status-history`,
    );
    return { ...res, data: res.data?.data ?? [] };
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    const res = await api.delete<null, ApiResponse<null>>(
      `/appointments/${id}`,
    );
    if (res.success) notifyAppointmentsUpdated();
    return res;
  },

  getPatientHistory: async (
    patientId: number,
    params?: Record<string, unknown>,
  ): Promise<ApiResponse<PatientHistoryResponse>> => {
    return api.get(`/appointments/patient/${patientId}/history`, { params });
  },

  getPersonas: async (
    search?: string,
  ): Promise<ApiResponse<PersonaRecord[]>> => {
    const res: ApiResponse<{ data: PersonaRecord[] }> = await api.get(
      "/persona",
      { params: { search } },
    );
    return { ...res, data: res.data?.data ?? [] };
  },

  getUsuarios: async (): Promise<ApiResponse<UsuarioRecord[]>> => {
    const res: ApiResponse<{ usuarios: UsuarioRecord[] }> =
      await api.get("/usuario/all");
    return { ...res, data: res.data?.usuarios ?? [] };
  },

  getPendingCount: async (): Promise<ApiResponse<{ count: number }>> => {
    return api.get("/appointments/pending-count");
  },
};
