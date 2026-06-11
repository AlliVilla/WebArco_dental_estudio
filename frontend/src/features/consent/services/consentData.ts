import type { ConsentFormValues, ConsentRecord } from "../types";

export const initialConsents: ConsentRecord[] = [
  {
    id: "CON-001",
    fecha: "05/06/2026",
    hora: "10:30 AM",
    paciente: "María Fernanda López García",
    procedimiento: "Extracción de molar #36",
    doctor: "Dr. Carlos Medina",
    estado: "firmado",
    declaracion:
      "Yo, el abajo firmante, declaro que la información proporcionada sobre mi historial médico es verídica y completa. Entiendo que ocultar información relevante puede afectar mi seguridad durante el procedimiento.",
    riesgos:
      "Se informa al paciente que el procedimiento conlleva riesgos potenciales, incluyendo: sangrado, infección, reacción a anestesia, daño a tejidos adyacentes y, en casos poco comunes, complicaciones durante la recuperación.",
    clausula:
      "Al firmar este documento, el paciente acepta voluntariamente el procedimiento indicado, reconociendo haber comprendido los riesgos y beneficios, y autoriza al equipo médico de ARCO Dental Studio a proceder.",
    patientSignature: "signed-patient-seed",
    doctorSignature: "signed-doctor-seed",
  },
  {
    id: "CON-002",
    fecha: "04/06/2026",
    hora: "02:00 PM",
    paciente: "Roberto Sánchez Flores",
    procedimiento: "Implante dental superior",
    doctor: "Dr. Carlos Medina",
    estado: "pendiente_doctor",
    declaracion:
      "Yo, el abajo firmante, declaro que la información proporcionada sobre mi historial médico es verídica y completa.",
    riesgos:
      "Se informa al paciente que el procedimiento conlleva riesgos potenciales propios del tratamiento odontológico indicado.",
    clausula:
      "El paciente acepta voluntariamente el procedimiento indicado y autoriza al equipo médico de ARCO Dental Studio a proceder.",
    patientSignature: "signed-patient-seed",
  },
  {
    id: "CON-003",
    fecha: "03/06/2026",
    hora: "09:00 AM",
    paciente: "Ana Lucía Pérez Martínez",
    procedimiento: "Cirugía periodontal",
    doctor: "Dra. Valeria Torres",
    estado: "firmado",
    declaracion:
      "Yo, el abajo firmante, declaro que la información proporcionada sobre mi historial médico es verídica y completa.",
    riesgos:
      "El paciente fue informado sobre molestias, inflamación, sangrado e indicaciones posteriores al procedimiento.",
    clausula:
      "El paciente acepta el procedimiento y autoriza al equipo médico de ARCO Dental Studio a proceder.",
    patientSignature: "signed-patient-seed",
    doctorSignature: "signed-doctor-seed",
  },
  {
    id: "CON-004",
    fecha: "02/06/2026",
    hora: "11:00 AM",
    paciente: "Diego Hernández Castro",
    procedimiento: "Blanqueamiento dental",
    doctor: "Dr. Carlos Medina",
    estado: "firmado",
    declaracion:
      "Yo, el abajo firmante, declaro que la información proporcionada sobre mi historial médico es verídica y completa.",
    riesgos:
      "El paciente fue informado sobre sensibilidad temporal y cuidados posteriores al blanqueamiento dental.",
    clausula:
      "El paciente acepta el procedimiento y autoriza al equipo médico de ARCO Dental Studio a proceder.",
    patientSignature: "signed-patient-seed",
    doctorSignature: "signed-doctor-seed",
  },
  {
    id: "CON-005",
    fecha: "01/06/2026",
    hora: "03:30 PM",
    paciente: "Carla Jiménez Vega",
    procedimiento: "Corona de porcelana",
    doctor: "Dra. Valeria Torres",
    estado: "pendiente_doctor",
    declaracion:
      "Yo, el abajo firmante, declaro que la información proporcionada sobre mi historial médico es verídica y completa.",
    riesgos:
      "El paciente fue informado sobre ajustes, sensibilidad y controles posteriores a la colocación de corona.",
    clausula:
      "El paciente acepta el procedimiento y autoriza al equipo médico de ARCO Dental Studio a proceder.",
    patientSignature: "signed-patient-seed",
  },
];

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
