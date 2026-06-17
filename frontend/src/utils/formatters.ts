/**
 * Formats a currency value as Honduran Lempiras (L.)
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("es-HN", {
    style: "currency",
    currency: "HNL",
  })
    .format(value)
    .replace("HNL", "L.");
};

/**
 * Formats an ISO date string into a legible Spanish format
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return "";
  const str = dateString.length === 10 ? `${dateString}T00:00:00` : dateString;
  const date = new Date(str);
  return new Intl.DateTimeFormat("es-HN", {
    dateStyle: "medium",
  }).format(date);
};

/**
 * Calculates age from an ISO date string.
 */
export const calculateAge = (dateString: string): number => {
  const str = dateString.length === 10 ? `${dateString}T00:00:00` : dateString;
  const birth = new Date(str);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age;
};

/**
 * Formats an identity card number into standard Honduras format (0000-0000-00000)
 */
export const formatIdentity = (id: string): string => {
  if (!id || id.length !== 13) return id;
  return `${id.substring(0, 4)}-${id.substring(4, 8)}-${id.substring(8)}`;
};

/**
 * Formats an identity card number into standard Honduras format (0000-0000-00000)
 */
export const formatInitials = (nombre: string): string => {
  const [a, b] = nombre.trim().split(" ");
  return ((a?.[0] ?? "") + (b?.[0] ?? "")).toUpperCase();
};

// Normaliza texto para búsqueda: elimina tildes, compacta espacios y convierte a minúsculas
export function normalizeSearch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function matchesNormalizedSearch(text: string, search: string): boolean {
  const normalizedSearch = normalizeSearch(search);
  if (!normalizedSearch) return true;

  const normalizedText = normalizeSearch(text);
  return normalizedSearch
    .split(" ")
    .filter(Boolean)
    .every((word) => normalizedText.includes(word));
}

export const obtenerHoyLocal = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dia}`;
};

export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (c) => map[c]);
};

export const generateUUID = (): string =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
