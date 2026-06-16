import api from '../../../services/api';
import type { ApiResponse } from '../../../types/api';
import type {
  DashboardFinancialSummary,
  DashboardGeneralSummary,
} from '../types';

export const dashboardService = {
  getGeneralSummary: async (): Promise<ApiResponse<DashboardGeneralSummary>> => {
    return api.get('/dashboard/resumen');
  },

  getFinancialSummary: async (): Promise<ApiResponse<DashboardFinancialSummary>> => {
    return api.get('/dashboard/financiero');
  },
};
