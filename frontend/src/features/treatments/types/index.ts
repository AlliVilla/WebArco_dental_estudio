export interface Treatment {
  id: number;
  especialidad: string;
  nombre: string;
  descripcion?: string;
  impactoOdontograma: string;
  precio: number;
}

export type TreatmentInput = Omit<Treatment, "id">;

export const ESPECIALIDADES = [
  "Odontología General y Preventiva",
  "Odontología Especializada",
  "Odontología Estética",
  "Ortodoncia y Ortopedia Maxilar",
  "Cirugía Bucal e Implantología",
  "Prótesis y Rehabilitación Oral",
] as const;

export const ESTADOS_ODONTOGRAMA = [
  "Sano",
  "Caries",
  "Obturación",
  "Extracción",
  "Ausente",
  "Endodoncia",
  "Corona",
  "Prótesis",
  "Implante",
  "Puente",
] as const;

export const MOCK_TREATMENTS: Treatment[] = [
  {
    id: 1,
    especialidad: "Odontología General y Preventiva",
    nombre: "Profilaxis",
    impactoOdontograma: "Sano",
    precio: 350,
  },
  {
    id: 2,
    especialidad: "Odontología Estética",
    nombre: "Blanqueamiento dental",
    impactoOdontograma: "Corona",
    precio: 1200,
  },
  {
    id: 3,
    especialidad: "Cirugía Bucal e Implantología",
    nombre: "Extracción de terceras molares",
    impactoOdontograma: "Extracción",
    precio: 800,
  },
  {
    id: 4,
    especialidad: "Ortodoncia y Ortopedia Maxilar",
    nombre: "Brackets metálicos",
    impactoOdontograma: "Corona",
    precio: 15000,
  },
  {
    id: 5,
    especialidad: "Odontología General y Preventiva",
    nombre: "Aplicación de flúor",
    impactoOdontograma: "Sano",
    precio: 200,
  },
  {
    id: 6,
    especialidad: "Prótesis y Rehabilitación Oral",
    nombre: "Prótesis total",
    impactoOdontograma: "Prótesis",
    precio: 8000,
  },
];
