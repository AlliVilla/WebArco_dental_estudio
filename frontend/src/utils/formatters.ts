/**
 * Formats a currency value as Honduran Lempiras (L.)
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-HN', {
    style: 'currency',
    currency: 'HNL',
  }).format(value).replace('HNL', 'L.');
};

/**
 * Formats an ISO date string into a legible Spanish format
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-HN', {
    dateStyle: 'medium',
  }).format(date);
};

/**
 * Formats an identity card number into standard Honduras format (0000-0000-00000)
 */
export const formatIdentity = (id: string): string => {
  if (!id || id.length !== 13) return id;
  return `${id.substring(0, 4)}-${id.substring(4, 8)}-${id.substring(8)}`;
};
