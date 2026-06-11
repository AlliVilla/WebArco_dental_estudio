export const COLORS = {
  primary: '#0BC5DF',
  text: '#203F49',
  muted: '#888F94',
  border: '#D3D7DA',
  borderLight: '#F1F3F4',
  background: '#FAFBFB',
  white: '#fff',
  danger: '#E24B4A',
  warning: '#EF9F27',
  success: '#1D9E75',
  todayBg: '#E6F8FB',
  headerBg: '#F8F9FA',
};

export const STATUS_COLORS: Record<string, string> = {
  programada: '#0BC5DF',
  confirmada: '#1D9E75',
  cancelada: '#E24B4A',
  atendida: '#203F49',
  ausente: '#EF9F27',
  reprogramada: '#3B82F6',
};

export const STATUS_STYLES: Record<string, { bg: string; border: string; text: string; label: string }> = {
  programada: { bg: '#E6F8FB', border: '#B2EDF5', text: '#0BC5DF', label: 'Programada' },
  confirmada: { bg: '#F5F3FF', border: '#DDD6FE', text: '#8B5CF6', label: 'Confirmada' },
  atendida: { bg: '#ECFDF5', border: '#A7F3D0', text: '#10B981', label: 'Atendida' },
  cancelada: { bg: '#FEF2F2', border: '#FECACA', text: '#EF4444', label: 'Cancelada' },
  ausente: { bg: '#FFF7ED', border: '#FFEDD5', text: '#F97316', label: 'Ausente' },
  reprogramada: { bg: '#EFF6FF', border: '#BFDBFE', text: '#3B82F6', label: 'Reprogramada' },
};

export const STATUS_OPTIONS = [
  { value: 'programada', label: 'Programada' },
  { value: 'confirmada', label: 'Confirmada' },
  { value: 'atendida', label: 'Atendida' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'ausente', label: 'Ausente' },
  { value: 'reprogramada', label: 'Reprogramada' },
];

export const TIPO_CITA_OPTIONS = [
  { value: 'Consulta general', label: 'Consulta general (1 hora)' },
  { value: 'Especialidad', label: 'Especialidad (2 horas)' },
];

export const VIEW_OPTIONS = [
  { value: 'day', label: 'Día' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
];

// ─── Calendar time-range config ──────────────────────────────────────────────
// To adjust the visible hour range of the calendar, change ONLY these two values.
// CALENDAR_START_HOUR: first hour shown (inclusive), e.g. 7 → 07:00
// CALENDAR_END_HOUR:   last hour boundary (exclusive), e.g. 21 → up to 21:00
export const CALENDAR_START_HOUR = 7;
export const CALENDAR_END_HOUR = 21;

// Pixels allocated per hour in the scrollable time body.
// Increasing this makes the grid taller and citas easier to read.
export const PX_PER_HOUR = 80;

// Derived — do not edit directly.
export const VISIBLE_HOURS = CALENDAR_END_HOUR - CALENDAR_START_HOUR;
