export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3030';

export const APP_NAME = 'WebArco Dental Studio';

export const DEFAULT_PAGE_SIZE = 10;

export const PATIENT_DEPARTMENTS = [
  { value: '2', label: 'Choluteca' },
  { value: '6', label: 'Cortés' },
  { value: '8', label: 'Francisco Morazán' },
  { value: '10', label: 'Intibucá' },
  { value: '15', label: 'Olancho' },
  { value: '16', label: 'Santa Bárbara' },
];

export const PATIENT_MUNICIPALITIES: Record<string, { value: string; label: string }[]> = {
  '2': [
    { value: '9', label: 'Choluteca' },
    { value: '14', label: 'El Triunfo' },
    { value: '23', label: 'San Marcos de Colón' },
  ],
  '6': [
    { value: '79', label: 'San Pedro Sula' },
    { value: '80', label: 'Choloma' },
    { value: '89', label: 'Villanueva' },
    { value: '90', label: 'La Lima' },
  ],
  '8': [
    { value: '110', label: 'Tegucigalpa' },
    { value: '118', label: 'Lepaterique' },
    { value: '132', label: 'Santa Lucía' },
    { value: '135', label: 'Valle de Ángeles' },
  ],
  '10': [
    { value: '144', label: 'La Esperanza' },
    { value: '149', label: 'Intibucá' },
    { value: '150', label: 'Jesús de Otoro' },
  ],
  '15': [
    { value: '228', label: 'Juticalpa' },
    { value: '230', label: 'Catacamas' },
    { value: '250', label: 'Patuca' },
  ],
  '16': [
    { value: '251', label: 'Santa Bárbara' },
    { value: '262', label: 'Las Vegas' },
    { value: '278', label: 'Trinidad' },
  ],
};

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
