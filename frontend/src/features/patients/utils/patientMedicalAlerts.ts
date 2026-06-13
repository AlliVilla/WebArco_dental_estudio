import { PATIENT_SYSTEMIC_DISEASES } from "../../../config/constants";

export type MedicalAlertTone = "warning" | "danger" | "anesthesia";

export type MedicalAlertBadge = {
  id: string;
  label: string;
  tone: MedicalAlertTone;
};

type PatientMedicalFields = {
  enfermedades?: string | null;
  otras_enfermedades?: string | null;
  medicamentos?: string | null;
  alergias?: string | null;
  reaccion_anestesia?: string | null;
};

export function parseEnfermedadesList(enfermedades: string | null | undefined): string[] {
  if (!enfermedades) return [];

  try {
    const parsed = JSON.parse(enfermedades);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function parseAlergiasList(alergias: string | null | undefined): string[] {
  if (!alergias?.trim()) return [];

  const separators = /[,;]\s*|\s*,\s*|\s+y\s+/i;
  return alergias
    .split(separators)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildMedicalAlertBadges(patient: PatientMedicalFields): MedicalAlertBadge[] {
  const badges: MedicalAlertBadge[] = [];

  parseEnfermedadesList(patient.enfermedades).forEach((diseaseId) => {
    if (diseaseId === "otras") return;

    const matched = PATIENT_SYSTEMIC_DISEASES.find((disease) => disease.id === diseaseId);
    badges.push({
      id: `disease-${diseaseId}`,
      label: matched?.label ?? diseaseId,
      tone: "warning",
    });
  });

  if (patient.otras_enfermedades?.trim()) {
    badges.push({
      id: "otras-enfermedades",
      label: patient.otras_enfermedades.trim(),
      tone: "warning",
    });
  }

  parseAlergiasList(patient.alergias).forEach((alergia, index) => {
    badges.push({
      id: `alergia-${index}-${alergia}`,
      label: alergia.toLowerCase().startsWith("alergia") ? alergia : `Alergia: ${alergia}`,
      tone: "danger",
    });
  });

  if (patient.reaccion_anestesia === "si") {
    badges.push({
      id: "reaccion-anestesia",
      label: "Reacción a anestesia",
      tone: "anesthesia",
    });
  }

  return badges;
}

export function buildMedicalWarningDetails(patient: PatientMedicalFields): string[] {
  const details: string[] = [];

  if (patient.reaccion_anestesia === "si") {
    details.push(
      "El paciente ha reportado reacciones a la anestesia. Revisar el historial clínico antes de administrar anestésicos.",
    );
  }

  if (patient.medicamentos?.trim()) {
    details.push(`Medicamentos actuales: ${patient.medicamentos.trim()}`);
  }

  return details;
}

export function hasMedicalAlerts(patient: PatientMedicalFields): boolean {
  return buildMedicalAlertBadges(patient).length > 0;
}
