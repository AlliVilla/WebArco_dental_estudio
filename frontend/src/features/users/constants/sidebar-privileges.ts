import type { NavId } from '../../../components/Sidebar';

export const SIDEBAR_PRIVILEGES: Partial<Record<NavId, number[]>> = {
  dashboard: [1],

  "patients-list": [16],
  "patient-expediente": [20],
  odontogram: [3],

  "consentimientos-lista": [25],

  citas: [26],

  recordatorios: [30],
  "reminders-historial": [30],

  "billing-income": [12],
  "billing-expense": [13],
  "billing-list": [12, 13],
  "billing-closures": [15],

  "estado-resultado": [2],

  "users-list": [6],
  "roles-management": [34],

  inventory: [63],
  treatments: [65],
};
