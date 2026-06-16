export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3030';

export const APP_NAME = 'WebArco Dental Studio';

export const DEFAULT_PAGE_SIZE = 10;

export const PATIENT_SYSTEMIC_DISEASES = [
  { id: 'diabetes', label: 'Diabetes' },
  { id: 'hipertension', label: 'Hipertensión' },
  { id: 'cardiopatias', label: 'Cardiopatías' },
  { id: 'epoc', label: 'EPOC' },
  { id: 'hepatitis', label: 'Hepatitis' },
  { id: 'cancer', label: 'Cáncer' },
  { id: 'osteoporosis', label: 'Osteoporosis' },
  { id: 'renal', label: 'Enfermedad renal' },
  { id: 'inmunologica', label: 'Enfermedad hepática' },
  { id: 'otras', label: 'Otras' },
];

// Dental clinic custom configurations
export const DENTAL_CHART = {
  PERMANENT_TEETH_UPPER: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
  PERMANENT_TEETH_LOWER: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
  TEMPORARY_TEETH_UPPER: [55, 54, 53, 52, 51, 61, 62, 63, 64, 65],
  TEMPORARY_TEETH_LOWER: [85, 84, 83, 82, 81, 71, 72, 73, 74, 75],
};
