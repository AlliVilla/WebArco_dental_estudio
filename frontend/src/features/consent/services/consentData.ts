import type { ConsentFormValues, ConsentRecord } from "../types/index";

export const defaultFormValues: ConsentFormValues = {
  paciente: "María Fernanda López García",
  doctor: "Dr. Carlos Medina",
  procedimiento: "Extracción de molar #36",
  fechaHora: "2026-06-06T10:30",
  declaracion:
    "Yo, el abajo firmante, declaro que la información proporcionada sobre mi historial médico es verídica y completa. Entiendo que ocultar información relevante puede afectar mi seguridad durante el procedimiento.",
  riesgos: "",
  clausula:
    "Al firmar este documento, el paciente acepta voluntariamente el procedimiento indicado, reconociendo haber comprendido los riesgos y beneficios, y autoriza al equipo médico de ARCO Dental Studio a proceder.",
};

export const statusOptions = [
  { value: "firmado", label: "Firmado" },
  { value: "pendiente_doctor", label: "Pendiente firma doctor" },
  { value: "pendiente_paciente", label: "Pendiente firma paciente" },
];

export const doctorOptions = [
  { value: "Dr. Carlos Medina", label: "Dr. Carlos Medina" },
  { value: "Dra. Valeria Torres", label: "Dra. Valeria Torres" },
  { value: "Dra. Karla Arita", label: "Dra. Karla Arita" },
];

export const procedimientoOptions = [
  { value: "Extracción de molar #36", label: "Extracción de molar #36" },
  { value: "Implante dental superior", label: "Implante dental superior" },
  { value: "Cirugía periodontal", label: "Cirugía periodontal" },
  { value: "Blanqueamiento dental", label: "Blanqueamiento dental" },
  { value: "Corona de porcelana", label: "Corona de porcelana" },
];
