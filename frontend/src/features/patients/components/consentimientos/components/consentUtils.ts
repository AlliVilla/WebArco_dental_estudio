import type { ConsentStatus, ConsentStep } from "./types";

export function getStatusMeta(status: ConsentStatus) {
  if (status === "firmado") {
    return {
      label: "Firmado",
      background: "var(--arco-success)",
      color: "var(--primary-foreground)",
    };
  }

  if (status === "pendiente_doctor") {
    return {
      label: "Pendiente",
      background: "var(--arco-warning)",
      color: "var(--primary-foreground)",
    };
  }

  return {
    label: "Pendiente paciente",
    background: "var(--arco-warning-soft)",
    color: "var(--arco-warning)",
  };
}

export function formatDisplayDate(dateTime: string) {
  if (!dateTime) return "";
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return dateTime;
  return new Intl.DateTimeFormat("es-HN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDisplayTime(dateTime: string) {
  if (!dateTime) return "";
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-HN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function stepLabel(step: ConsentStep) {
  const labels: Record<ConsentStep, string> = {
    1: "Formulario",
    2: "Firma paciente",
    3: "Firma doctor",
    4: "Completado",
  };
  return labels[step];
}
