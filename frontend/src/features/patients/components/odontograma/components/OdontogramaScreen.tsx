import React, { useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

type ToothState =
  | 'sano' | 'caries' | 'obturacion' | 'extraccion' | 'ausente'
  | 'endodoncia' | 'corona' | 'protesis' | 'implante' | 'puente';

interface HistoryEntry {
  id: number;
  toothNumber: number;
  previousState: ToothState | null;
  newState: ToothState;
  observation: string;
  doctor: string;
  date: string;
}

interface ToothData {
  number: number;
  state: ToothState;
  observation: string;
}

// ── State config ──────────────────────────────────────────────────────────────

const STATE_CONFIG: Record<ToothState, { label: string; color: string; bg: string; textColor: string }> = {
  sano: { label: 'Sano', color: '#A8D5BA', bg: '#D6EFE1', textColor: '#4A8C68' },
  caries: { label: 'Caries', color: '#F4AFAD', bg: '#FCE4E4', textColor: '#B85755' },
  obturacion: { label: 'Obturación', color: '#90D0E8', bg: '#D4EDF7', textColor: '#3A88AA' },
  extraccion: { label: 'Extracción', color: '#B8BEC6', bg: '#E6E8EC', textColor: '#5A6370' },
  ausente: { label: 'Ausente', color: '#CDD0D5', bg: '#ECEEF1', textColor: '#7A7F88' },
  endodoncia: { label: 'Endodoncia', color: '#F5CC80', bg: '#FDF0D0', textColor: '#9A7020' },
  corona: { label: 'Corona', color: '#9ABFD4', bg: '#D8EBF4', textColor: '#3A6E88' },
  protesis: { label: 'Prótesis', color: '#C4ADED', bg: '#EDE5F7', textColor: '#6A48A0' },
  implante: { label: 'Implante', color: '#A0B8E8', bg: '#DDE5F7', textColor: '#3A58A0' },
  puente: { label: 'Puente', color: '#E8BCA0', bg: '#FAE8DC', textColor: '#985030' },
};

// ── Arch geometry ─────────────────────────────────────────────────────────────

type ToothShape = 'central_incisor' | 'lateral_incisor' | 'canine' | 'premolar' | 'molar';

interface ArchTooth {
  number: number;
  cx: number;
  cy: number;
  rotation: number;
  shape: ToothShape;
  w: number;
  h: number;
}

// ── Adult dentition (32 teeth) ────────────────────────────────────────────────
const UPPER_NUMBERS = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_NUMBERS = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// ── Primary dentition (20 teeth, FDI 5x–8x) ──────────────────────────────────
const UPPER_PRIMARY = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const LOWER_PRIMARY = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

function isPrimary(n: number) { return n >= 50; }

function toothShape(n: number): ToothShape {
  const d = n % 10;
  if (d === 1) return 'central_incisor';
  if (d === 2) return 'lateral_incisor';
  if (d === 3) return 'canine';
  // Primary teeth have no premolars — 4 and 5 are primary molars
  if (isPrimary(n) && (d === 4 || d === 5)) return 'molar';
  if (d === 4 || d === 5) return 'premolar';
  return 'molar';
}

function toothDims(s: ToothShape, upper: boolean, primary = false): { w: number; h: number } {
  if (primary) {
    const u: Record<ToothShape, { w: number; h: number }> = {
      central_incisor: { w: 14, h: 11 },
      lateral_incisor: { w: 12, h: 10 },
      canine: { w: 12, h: 13 },
      premolar: { w: 14, h: 13 },
      molar: { w: 17, h: 14 },
    };
    const l: Record<ToothShape, { w: number; h: number }> = {
      central_incisor: { w: 9, h: 10 },
      lateral_incisor: { w: 10, h: 10 },
      canine: { w: 11, h: 13 },
      premolar: { w: 13, h: 13 },
      molar: { w: 16, h: 14 },
    };
    return (upper ? u : l)[s];
  }
  const u: Record<ToothShape, { w: number; h: number }> = {
    central_incisor: { w: 19, h: 14 },
    lateral_incisor: { w: 15, h: 13 },
    canine: { w: 14, h: 17 },
    premolar: { w: 18, h: 16 },
    molar: { w: 23, h: 19 },
  };
  const l: Record<ToothShape, { w: number; h: number }> = {
    central_incisor: { w: 11, h: 12 },
    lateral_incisor: { w: 13, h: 12 },
    canine: { w: 14, h: 17 },
    premolar: { w: 17, h: 16 },
    molar: { w: 22, h: 19 },
  };
  return (upper ? u : l)[s];
}

// Build arch positions along an ellipse.
// The off-canvas center creates the natural arch curve.
// Rotation formula: aligns local -y (buccal face) toward the outward radial direction.
function buildArch(
  numbers: number[],
  cx: number, cy: number,
  a: number, b: number,
  startDeg: number, endDeg: number,
  upper: boolean,
  primary = false,
): ArchTooth[] {
  const n = numbers.length;
  const step = (endDeg - startDeg) / (n - 1);
  return numbers.map((num, i) => {
    const deg = startDeg + step * i;
    const rad = (deg * Math.PI) / 180;
    const tcx = cx + a * Math.cos(rad);
    const tcy = cy + b * Math.sin(rad);
    const dx = tcx - cx;
    const dy = tcy - cy;
    const norm = Math.sqrt(dx * dx + dy * dy);
    const rotation = (Math.atan2(dx / norm, -(dy / norm)) * 180) / Math.PI;
    const s = toothShape(num);
    const { w, h } = toothDims(s, upper, primary);
    return { number: num, cx: tcx, cy: tcy, rotation, shape: s, w, h };
  });
}

// ── Adult arches (32 teeth) ───────────────────────────────────────────────────
const UPPER_ARCH = buildArch(UPPER_NUMBERS, 285, -28, 252, 192, 150, 30, true);
const LOWER_ARCH = buildArch(LOWER_NUMBERS, 285, 482, 252, 192, 210, 330, false);

// ── Primary arches (20 teeth) — smaller, tighter ellipse ─────────────────────
const UPPER_PRIMARY_ARCH = buildArch(UPPER_PRIMARY, 285, 5, 190, 148, 148, 32, true, true);
const LOWER_PRIMARY_ARCH = buildArch(LOWER_PRIMARY, 285, 450, 190, 148, 212, 328, false, true);

// ── Initial data ──────────────────────────────────────────────────────────────

function initAdultTeeth(): Record<number, ToothData> {
  const m: Record<number, ToothData> = {};
  [...UPPER_NUMBERS, ...LOWER_NUMBERS].forEach(n => { m[n] = { number: n, state: 'sano', observation: '' }; });
  m[16].state = 'obturacion';
  m[36].state = 'endodoncia';
  m[46].state = 'ausente';
  m[25].state = 'corona';
  m[14].state = 'caries';
  m[44].state = 'implante';
  m[27].state = 'puente';
  return m;
}

function initPrimaryTeeth(): Record<number, ToothData> {
  const m: Record<number, ToothData> = {};
  [...UPPER_PRIMARY, ...LOWER_PRIMARY].forEach(n => { m[n] = { number: n, state: 'sano', observation: '' }; });
  m[54].state = 'caries';
  m[75].state = 'obturacion';
  return m;
}

const INITIAL_HISTORY: HistoryEntry[] = [
  { id: 1, toothNumber: 16, previousState: 'sano', newState: 'caries', observation: 'Lesión oclusal incipiente', doctor: 'Dr. Karla Arita', date: '2026-05-10' },
  { id: 2, toothNumber: 16, previousState: 'caries', newState: 'obturacion', observation: 'Restauración composite clase I', doctor: 'Dr. Karla Arita', date: '2026-05-20' },
  { id: 3, toothNumber: 36, previousState: 'sano', newState: 'endodoncia', observation: 'Pulpitis irreversible', doctor: 'Dr. Marco Salinas', date: '2026-05-28' },
  { id: 4, toothNumber: 46, previousState: null, newState: 'ausente', observation: 'Extracción previa al tratamiento', doctor: 'Dr. Karla Arita', date: '2026-04-15' },
];

// ── Tooth Crown SVG component ─────────────────────────────────────────────────
// Drawn centered at (0,0). Buccal face = local -y (top). Rotated by parent group.

interface CrownProps {
  shape: ToothShape;
  w: number;
  h: number;
  state: ToothState;
  isSelected: boolean;
}

function ToothCrown({ shape, w, h, state, isSelected }: CrownProps) {
  const cfg = STATE_CONFIG[state];
  const fill = (state === 'ausente' || state === 'extraccion') ? '#E8EAED' : cfg.bg;
  const stroke = isSelected ? '#0BC5DF' : (state === 'ausente' || state === 'extraccion') ? '#BBBFC5' : cfg.color;
  const sw = isSelected ? 2.5 : 1.5;

  // ---- absent / extracted ----
  if (state === 'ausente' || state === 'extraccion') {
    return (
      <g>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={3}
          fill={fill} stroke="#BBBFC5" strokeWidth={1} strokeDasharray="2 1.5" />
        <line x1={-w / 2 + 2} y1={-h / 2 + 2} x2={w / 2 - 2} y2={h / 2 - 2}
          stroke="#B0B6BC" strokeWidth={1.5} strokeLinecap="round" />
        <line x1={w / 2 - 2} y1={-h / 2 + 2} x2={-w / 2 + 2} y2={h / 2 - 2}
          stroke="#B0B6BC" strokeWidth={1.5} strokeLinecap="round" />
        {isSelected && (
          <rect x={-w / 2 - 3} y={-h / 2 - 3} width={w + 6} height={h + 6} rx={6}
            fill="none" stroke="#0BC5DF" strokeWidth={2} strokeDasharray="3 2" opacity={0.7} />
        )}
      </g>
    );
  }

  // ---- crown silhouette by tooth type ----
  let crown: React.ReactNode;
  let detail: React.ReactNode = null;

  if (shape === 'central_incisor' || shape === 'lateral_incisor') {
    // Slightly trapezoidal — wider at buccal edge (top)
    const wb = w, wp = w * 0.76;
    crown = (
      <path
        d={`M${-wb / 2 + 1.5},${-h / 2} L${wb / 2 - 1.5},${-h / 2}
            Q${wb / 2},${-h / 2} ${wb / 2},${-h / 2 + 1.5}
            L${wp / 2 + 0.5},${h / 2}
            Q0,${h / 2 + 1} ${-wp / 2 - 0.5},${h / 2}
            L${-wb / 2},${-h / 2 + 1.5}
            Q${-wb / 2},${-h / 2} ${-wb / 2 + 1.5},${-h / 2} Z`}
        fill={fill} stroke={stroke} strokeWidth={sw}
      />
    );
    // Three mamelons on the incisal (buccal) edge
    detail = (
      <g opacity={0.32} strokeLinecap="round">
        <line x1={-2.8} y1={-h / 2 + 0.5} x2={-2.4} y2={-h / 2 + h * 0.24} stroke={stroke} strokeWidth={0.7} />
        <line x1={0} y1={-h / 2} x2={0} y2={-h / 2 + h * 0.24} stroke={stroke} strokeWidth={0.7} />
        <line x1={2.8} y1={-h / 2 + 0.5} x2={2.4} y2={-h / 2 + h * 0.24} stroke={stroke} strokeWidth={0.7} />
      </g>
    );
  } else if (shape === 'canine') {
    // Pentagon with prominent buccal cusp
    crown = (
      <path
        d={`M 0 ${-h / 2}
            L ${w / 2} ${-h / 2 + h * 0.36}
            L ${w * 0.44} ${h / 2}
            L ${-w * 0.44} ${h / 2}
            L ${-w / 2} ${-h / 2 + h * 0.36} Z`}
        fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"
      />
    );
    detail = (
      <line x1={0} y1={-h / 2 + 2} x2={0} y2={h / 2 - 3}
        stroke={stroke} strokeWidth={0.7} opacity={0.28} strokeLinecap="round" />
    );
  } else if (shape === 'premolar') {
    // Rounded rectangle with two visible cusps and central sulcus
    crown = (
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={4.5}
        fill={fill} stroke={stroke} strokeWidth={sw} />
    );
    detail = (
      <g>
        {/* Buccal cusp shadow */}
        <ellipse cx={-w * 0.2} cy={-h * 0.18} rx={w * 0.19} ry={h * 0.19} fill={stroke} fillOpacity={0.11} />
        {/* Palatal/lingual cusp shadow */}
        <ellipse cx={w * 0.18} cy={-h * 0.16} rx={w * 0.17} ry={h * 0.17} fill={stroke} fillOpacity={0.07} />
        {/* Central sulcus */}
        <line x1={-w * 0.05} y1={-h / 2 + 3} x2={-w * 0.05} y2={h / 2 - 3}
          stroke={stroke} strokeWidth={0.7} opacity={0.22} strokeLinecap="round" />
        {/* Transverse ridge */}
        <line x1={-w / 2 + 4} y1={h * 0.12} x2={w / 2 - 4} y2={h * 0.12}
          stroke={stroke} strokeWidth={0.55} opacity={0.18} strokeLinecap="round" />
      </g>
    );
  } else {
    // Molar: large rounded rect with cross-shaped fissure and four cusp shadows
    crown = (
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={5.5}
        fill={fill} stroke={stroke} strokeWidth={sw} />
    );
    detail = (
      <g>
        <ellipse cx={-w * 0.23} cy={-h * 0.21} rx={w * 0.19} ry={h * 0.17} fill={stroke} fillOpacity={0.11} />
        <ellipse cx={w * 0.23} cy={-h * 0.21} rx={w * 0.19} ry={h * 0.17} fill={stroke} fillOpacity={0.11} />
        <ellipse cx={-w * 0.23} cy={h * 0.24} rx={w * 0.17} ry={h * 0.15} fill={stroke} fillOpacity={0.08} />
        <ellipse cx={w * 0.23} cy={h * 0.24} rx={w * 0.17} ry={h * 0.15} fill={stroke} fillOpacity={0.08} />
        {/* Central fossa cross */}
        <line x1={0} y1={-h / 2 + 4} x2={0} y2={h / 2 - 4}
          stroke={stroke} strokeWidth={0.85} opacity={0.26} strokeLinecap="round" />
        <line x1={-w / 2 + 5} y1={h * 0.07} x2={w / 2 - 5} y2={h * 0.07}
          stroke={stroke} strokeWidth={0.85} opacity={0.26} strokeLinecap="round" />
      </g>
    );
  }

  // ---- state-specific overlay ----
  let overlay: React.ReactNode = null;
  switch (state) {
    case 'caries':
      overlay = (
        <ellipse cx={0} cy={-h * 0.05} rx={Math.min(w, h) * 0.28} ry={Math.min(w, h) * 0.26}
          fill="#6B0000" opacity={0.52} />
      );
      break;
    case 'obturacion':
      overlay = (
        <rect x={-w * 0.3} y={-h * 0.32} width={w * 0.6} height={h * 0.62} rx={2}
          fill={stroke} opacity={0.38} />
      );
      break;
    case 'endodoncia':
      overlay = (
        <g>
          <line x1={0} y1={-h / 2 + 2} x2={0} y2={h / 2 - 2}
            stroke={stroke} strokeWidth={2.2} opacity={0.7} strokeLinecap="round" />
          <circle cx={0} cy={0} r={Math.min(w, h) * 0.18} fill={stroke} opacity={0.6} />
        </g>
      );
      break;
    case 'corona':
    case 'protesis':
      overlay = (
        <>
          <rect x={-w / 2 + 1.5} y={-h / 2 + 1.5} width={w - 3} height={h - 3} rx={4}
            fill="none" stroke={stroke} strokeWidth={1.4} strokeDasharray="2.5 1.5" opacity={0.72} />
          <rect x={-w / 2 + 3.5} y={-h / 2 + 3.5} width={w - 7} height={h - 7} rx={2}
            fill={stroke} fillOpacity={0.08} />
        </>
      );
      break;
    case 'implante':
      overlay = (
        <g>
          <circle cx={0} cy={0} r={Math.min(w, h) * 0.27}
            fill="none" stroke={stroke} strokeWidth={2} opacity={0.78} />
          <line x1={-w * 0.18} y1={0} x2={w * 0.18} y2={0} stroke={stroke} strokeWidth={1.6} opacity={0.78} />
          <line x1={0} y1={-h * 0.18} x2={0} y2={h * 0.18} stroke={stroke} strokeWidth={1.6} opacity={0.78} />
        </g>
      );
      break;
    case 'puente':
      overlay = (
        <g>
          <line x1={-w / 2 + 1} y1={-h / 2 + 2.5} x2={w / 2 - 1} y2={-h / 2 + 2.5}
            stroke={stroke} strokeWidth={3} opacity={0.5} strokeLinecap="round" />
          <line x1={-w / 2 + 1} y1={h / 2 - 2.5} x2={w / 2 - 1} y2={h / 2 - 2.5}
            stroke={stroke} strokeWidth={3} opacity={0.5} strokeLinecap="round" />
        </g>
      );
      break;
  }

  // ---- selection ring ----
  const selRing = isSelected ? (
    <rect x={-w / 2 - 3.5} y={-h / 2 - 3.5} width={w + 7} height={h + 7} rx={7}
      fill="none" stroke="#0BC5DF" strokeWidth={2.2} strokeDasharray="4 2.5" opacity={0.7} />
  ) : null;

  return (
    <g>
      {crown}
      {detail}
      {overlay}
      {selRing}
    </g>
  );
}

// ── Odontogram SVG ────────────────────────────────────────────────────────────

function OdontogramSVG({
  teeth, selectedTooth, onSelect, dentition,
}: {
  teeth: Record<number, ToothData>;
  selectedTooth: number | null;
  onSelect: (n: number) => void;
  dentition: 'adult' | 'child';
}) {
  const W = 570;
  const H = 458;
  const isChild = dentition === 'child';
  const upperArch = isChild ? UPPER_PRIMARY_ARCH : UPPER_ARCH;
  const lowerArch = isChild ? LOWER_PRIMARY_ARCH : LOWER_ARCH;

  // Quadrant labels differ per dentition
  const qLabels = isChild
    ? ['Cuadrante 5', 'Cuadrante 6', 'Cuadrante 8', 'Cuadrante 7']
    : ['Cuadrante 1', 'Cuadrante 2', 'Cuadrante 4', 'Cuadrante 3'];

  const renderTooth = (t: ArchTooth) => {
    const tooth = teeth[t.number];
    const isSelected = selectedTooth === t.number;
    const rRad = (t.rotation * Math.PI) / 180;
    // label sits ~12px outward from the buccal (outer) face
    const labelDist = t.h / 2 + 12;
    const lx = t.cx + labelDist * Math.sin(rRad);
    const ly = t.cy - labelDist * Math.cos(rRad);

    return (
      <g key={t.number}>
        <g
          transform={`translate(${t.cx.toFixed(1)},${t.cy.toFixed(1)}) rotate(${t.rotation.toFixed(1)})`}
          onClick={() => onSelect(t.number)}
          style={{ cursor: 'pointer' }}
        >
          <ToothCrown shape={t.shape} w={t.w} h={t.h} state={tooth.state} isSelected={isSelected} />
          {/* Expanded invisible hit area */}
          <rect x={-t.w / 2 - 5} y={-t.h / 2 - 5} width={t.w + 10} height={t.h + 10} fill="transparent" />
        </g>
        <text
          x={lx.toFixed(1)} y={ly.toFixed(1)}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={7.5} fontWeight={isSelected ? 700 : 500}
          fill={isSelected ? '#0BC5DF' : '#9AA0A6'}
          style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          {t.number}
        </text>
      </g>
    );
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <radialGradient id="gum-upper" cx="50%" cy="60%" r="50%">
          <stop offset="0%" stopColor="#F5C5BC" stopOpacity="0.72" />
          <stop offset="65%" stopColor="#F0B8AE" stopOpacity="0.48" />
          <stop offset="100%" stopColor="#E8A89C" stopOpacity="0.15" />
        </radialGradient>
        <radialGradient id="gum-lower" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#F5C5BC" stopOpacity="0.72" />
          <stop offset="65%" stopColor="#F0B8AE" stopOpacity="0.48" />
          <stop offset="100%" stopColor="#E8A89C" stopOpacity="0.15" />
        </radialGradient>
        <filter id="tooth-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#00000018" />
        </filter>
      </defs>

      {/* Canvas background */}
      <rect width={W} height={H} fill="#F5F6F7" rx={0} />

      {/* ── Upper arch gum tissue (palatal) ── */}
      <ellipse cx={285} cy={95} rx={152} ry={88} fill="url(#gum-upper)" />
      <ellipse cx={285} cy={95} rx={118} ry={66} fill="#EDB8AC" opacity={0.28} />

      {/* ── Lower arch gum tissue (lingual) ── */}
      <ellipse cx={285} cy={362} rx={150} ry={82} fill="url(#gum-lower)" />
      <ellipse cx={285} cy={362} rx={116} ry={62} fill="#EDB8AC" opacity={0.28} />

      {/* Vertical midline */}
      <line x1={285} y1={18} x2={285} y2={440}
        stroke="#CDD0D5" strokeWidth={1.2} strokeDasharray="5 4" />

      {/* Horizontal arch separator */}
      <line x1={28} y1={229} x2={542} y2={229}
        stroke="#CDD0D5" strokeWidth={1.5} />

      {/* Quadrant labels */}
      <text x={160} y={104} textAnchor="middle" fontSize={10} fontWeight={600}
        fill="#C8B6B2" fontFamily="Inter, sans-serif">{qLabels[0]}</text>
      <text x={410} y={104} textAnchor="middle" fontSize={10} fontWeight={600}
        fill="#C8B6B2" fontFamily="Inter, sans-serif">{qLabels[1]}</text>
      <text x={160} y={366} textAnchor="middle" fontSize={10} fontWeight={600}
        fill="#C8B6B2" fontFamily="Inter, sans-serif">{qLabels[2]}</text>
      <text x={410} y={366} textAnchor="middle" fontSize={10} fontWeight={600}
        fill="#C8B6B2" fontFamily="Inter, sans-serif">{qLabels[3]}</text>

      {/* Superior / Inferior arch labels */}
      <text x={546} y={100} fontSize={8.5} fontWeight={600} fill="#AAAAAA"
        fontFamily="Inter, sans-serif" textAnchor="start"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
        Maxilar Superior
      </text>
      <text x={546} y={290} fontSize={8.5} fontWeight={600} fill="#AAAAAA"
        fontFamily="Inter, sans-serif" textAnchor="start"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
        Maxilar Inferior
      </text>

      {/* Interarch gap labels */}
      <text x={285} y={218} textAnchor="middle" fontSize={8} fill="#BBBBBB"
        fontFamily="Inter, sans-serif">Superior</text>
      <text x={285} y={243} textAnchor="middle" fontSize={8} fill="#BBBBBB"
        fontFamily="Inter, sans-serif">Inferior</text>

      {/* ── Upper arch teeth ── */}
      <g filter="url(#tooth-shadow)">
        {upperArch.map(renderTooth)}
      </g>

      {/* ── Lower arch teeth ── */}
      <g filter="url(#tooth-shadow)">
        {lowerArch.map(renderTooth)}
      </g>
    </svg>
  );
}

// ── Shared small components ───────────────────────────────────────────────────

function StateBadge({ state }: { state: ToothState | null }) {
  if (!state) return <span style={{ color: '#888F94', fontSize: 12 }}>—</span>;
  const cfg = STATE_CONFIG[state];
  return (
    <span style={{
      display: 'inline-block',
      background: cfg.bg,
      color: cfg.textColor,
      borderRadius: 20,
      padding: '3px 10px',
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.01em',
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

function FieldBadge({ type }: { type: 'Requerido' | 'Opcional' }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4,
      background: type === 'Requerido' ? '#FEF6E7' : '#F1F3F4',
      color: type === 'Requerido' ? '#EF9F27' : '#888F94',
    }}>
      {type}
    </span>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export function OdontogramScreen({ consultaId }: { consultaId?: number }) {
  if (consultaId) {
    // Referenciado para evitar advertencia de TypeScript (TS6133)
  }
  const [dentition, setDentition] = useState<'adult' | 'child'>('adult');
  const [adultTeeth, setAdultTeeth] = useState<Record<number, ToothData>>(initAdultTeeth);
  const [primaryTeeth, setPrimaryTeeth] = useState<Record<number, ToothData>>(initPrimaryTeeth);

  const teeth = dentition === 'adult' ? adultTeeth : primaryTeeth;
  const setTeeth = dentition === 'adult' ? setAdultTeeth : setPrimaryTeeth;

  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [pendingState, setPendingState] = useState<ToothState | ''>('');
  const [pendingObs, setPendingObs] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>(INITIAL_HISTORY);
  const [alert, setAlert] = useState<{ type: 'info' | 'success' | 'warning' | 'error'; text: string } | null>(
    { type: 'info', text: 'Selecciona un diente del odontograma para ver o editar su estado clínico.' }
  );
  const [histFilter, setHistFilter] = useState<number | 'all'>('all');

  const toothCount = dentition === 'adult' ? 32 : 20;

  const handleDentitionChange = (d: 'adult' | 'child') => {
    setDentition(d);
    setSelectedTooth(null);
    setPendingState('');
    setPendingObs('');
    setAlert({ type: 'info', text: 'Selecciona un diente del odontograma para ver o editar su estado clínico.' });
  };

  const DOCTOR = 'Dr. Karla Arita';
  const TODAY = new Date().toISOString().split('T')[0];

  const handleSelect = (n: number) => {
    if (selectedTooth === n) {
      setSelectedTooth(null); setPendingState(''); setPendingObs('');
      setAlert({ type: 'info', text: 'Selecciona un diente del odontograma para ver o editar su estado clínico.' });
      return;
    }
    setSelectedTooth(n); setPendingState(''); setPendingObs('');
    const cnt = history.filter(h => h.toothNumber === n).length;
    setAlert(cnt > 0
      ? { type: 'warning', text: `El diente #${n} tiene ${cnt} registro(s) previo(s). Revisa el historial antes de continuar.` }
      : null
    );
  };

  const handleSave = () => {
    if (!selectedTooth || !pendingState) {
      setAlert({ type: 'error', text: 'Debes seleccionar un estado antes de guardar el cambio.' }); return;
    }
    const prev = teeth[selectedTooth].state;
    const entry: HistoryEntry = {
      id: history.length + 1, toothNumber: selectedTooth,
      previousState: prev, newState: pendingState as ToothState,
      observation: pendingObs, doctor: DOCTOR, date: TODAY,
    };
    setTeeth(t => ({ ...t, [selectedTooth]: { ...t[selectedTooth], state: pendingState as ToothState, observation: pendingObs } }));
    setHistory(h => [entry, ...h]);
    setAlert({ type: 'success', text: `Cambio guardado correctamente para el diente #${selectedTooth}.` });
    setSelectedTooth(null); setPendingState(''); setPendingObs('');
  };

  const handleCancel = () => {
    setSelectedTooth(null); setPendingState(''); setPendingObs('');
    setAlert({ type: 'info', text: 'Selecciona un diente del odontograma para ver o editar su estado clínico.' });
  };

  const visibleHistory = histFilter === 'all' ? history : history.filter(h => h.toothNumber === histFilter);

  const alertStyle: Record<string, { bg: string; border: string; color: string; icon: string }> = {
    info: { bg: '#E6F8FB', border: '#0BC5DF', color: '#0899B0', icon: 'ℹ' },
    success: { bg: '#E8F7F2', border: '#1D9E75', color: '#1D9E75', icon: '✓' },
    warning: { bg: '#FEF6E7', border: '#EF9F27', color: '#C47F00', icon: '⚠' },
    error: { bg: '#FDF0F0', border: '#E24B4A', color: '#E24B4A', icon: '✕' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Alert */}
      {alert && (() => {
        const s = alertStyle[alert.type];
        return (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: s.bg, borderLeft: `4px solid ${s.border}`, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 14px' }}>
            <span style={{ color: s.color, fontWeight: 700, fontSize: 14 }}>{s.icon}</span>
            <span style={{ color: s.color, fontSize: 13, flex: 1 }}>{alert.text}</span>
            <button onClick={() => setAlert(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.color, fontSize: 16, opacity: 0.6, padding: 0 }}>×</button>
          </div>
        );
      })()}

      {/* Patient header */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #D3D7DA', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, color: '#203F49' }}>Odontograma Interactivo</h2>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#888F94' }}>
              Paciente: <strong style={{ color: '#203F49' }}>Ana López Martínez</strong>
              &nbsp;·&nbsp; Exp. #2024-00142 &nbsp;·&nbsp; Vista oclusal — {toothCount} dientes
            </p>
          </div>
          {/* Dentition toggle */}
          <div style={{ display: 'flex', background: '#F1F3F4', borderRadius: 10, padding: 3, gap: 2 }}>
            {(['adult', 'child'] as const).map(d => (
              <button
                key={d}
                onClick={() => handleDentitionChange(d)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  transition: 'all 0.15s',
                  background: dentition === d ? '#fff' : 'transparent',
                  color: dentition === d ? '#203F49' : '#888F94',
                  boxShadow: dentition === d ? '0 1px 4px #0000001A' : 'none',
                }}
              >
                {d === 'adult' ? '🦷 Adulto (32)' : '🧒 Niño (20)'}
              </button>
            ))}
          </div>
        </div>
        {/* Legend chips — pastel filled */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, maxWidth: 400, justifyContent: 'flex-end' }}>
          {(Object.entries(STATE_CONFIG) as [ToothState, typeof STATE_CONFIG[ToothState]][]).map(([key, cfg]) => (
            <span key={key} style={{
              background: cfg.bg,
              color: cfg.textColor,
              fontSize: 10,
              fontWeight: 600,
              borderRadius: 20,
              padding: '3px 10px',
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
            }}>
              {cfg.label}
            </span>
          ))}
        </div>
      </div>

      {/* Responsive CSS */}
      <style>{`
        .odonto-grid {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 20px;
          align-items: stretch;
        }
        .odonto-svg-card {
          background: #fff;
          border-radius: 12px;
          border: 1px solid #D3D7DA;
          padding: 16px;
          overflow: hidden;
        }
        .odonto-panel {
          display: flex;
          flex-direction: column;
          border-radius: 12px;
          padding: 20px;
          transition: border 0.2s;
        }
        @media (max-width: 860px) {
          .odonto-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Odontogram + Action Panel */}
      <div className="odonto-grid">

        {/* Arch SVG */}
        <div className="odonto-svg-card">
          <OdontogramSVG teeth={teeth} selectedTooth={selectedTooth} onSelect={handleSelect} dentition={dentition} />
        </div>

        {/* Action Panel */}
        <div
          className="odonto-panel"
          style={{
            background: '#fff',
            border: selectedTooth ? '1.5px solid #0BC5DF' : '1px solid #D3D7DA',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: selectedTooth ? '#E6F8FB' : '#F1F3F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={selectedTooth ? '#0BC5DF' : '#888F94'} strokeWidth="2">
                <path d="M12 2C9 2 7 4 7 7c0 4 2 8 5 13 3-5 5-9 5-13 0-3-2-5-5-5z" />
              </svg>
            </div>
            <div>
              <h4 style={{ margin: 0, color: '#203F49' }}>{selectedTooth ? `Diente #${selectedTooth}` : 'Panel de Acción'}</h4>
              {selectedTooth && (
                <p style={{ margin: 0, fontSize: 11, color: '#888F94' }}>
                  Estado actual: <StateBadge state={teeth[selectedTooth].state} />
                </p>
              )}
            </div>
          </div>

          {!selectedTooth ? (
            <div style={{ flex: 1, border: '2px dashed #D3D7DA', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#888F94', textAlign: 'center', padding: '28px 16px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D3D7DA" strokeWidth="1.5">
                <path d="M12 2C9 2 7 4 7 7c0 4 2 8 5 13 3-5 5-9 5-13 0-3-2-5-5-5z" />
              </svg>
              <span style={{ fontSize: 12 }}>Haz clic sobre un diente para editar su estado</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, minHeight: 0 }}>

              {/* Estado */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <label style={{ fontSize: 13, color: '#203F49', margin: 0 }}>Estado a asignar</label>
                  <FieldBadge type="Requerido" />
                </div>
                <select
                  value={pendingState}
                  onChange={e => setPendingState(e.target.value as ToothState)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #D3D7DA', background: '#F8F9FA', fontSize: 13, color: '#203F49', cursor: 'pointer' }}
                >
                  <option value="">— Seleccionar estado —</option>
                  {(Object.entries(STATE_CONFIG) as [ToothState, typeof STATE_CONFIG[ToothState]][]).map(([k, c]) => (
                    <option key={k} value={k}>{c.label}</option>
                  ))}
                </select>
                {pendingState && <div style={{ marginTop: 6 }}><StateBadge state={pendingState as ToothState} /></div>}
              </div>

              {/* Observación — crece para llenar el espacio disponible */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <label style={{ fontSize: 13, color: '#203F49', margin: 0 }}>Observación</label>
                  <FieldBadge type="Opcional" />
                </div>
                <textarea
                  value={pendingObs}
                  onChange={e => setPendingObs(e.target.value)}
                  placeholder="Notas clínicas adicionales..."
                  style={{
                    flex: 1,
                    minHeight: 80,
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #D3D7DA',
                    background: '#F8F9FA',
                    fontSize: 13,
                    color: '#203F49',
                    resize: 'none',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Auto-filled */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#888F94', display: 'block', marginBottom: 4 }}>Doctor responsable</label>
                  <div style={{ padding: '6px 10px', borderRadius: 8, background: '#F1F3F4', border: '1px solid #EAECEE', fontSize: 11, color: '#5F656A' }}>{DOCTOR}</div>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#888F94', display: 'block', marginBottom: 4 }}>Fecha del cambio</label>
                  <div style={{ padding: '6px 10px', borderRadius: 8, background: '#F1F3F4', border: '1px solid #EAECEE', fontSize: 11, color: '#5F656A' }}>{TODAY}</div>
                </div>
              </div>

              {/* Botones — pegados al fondo del panel */}
              <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
                <button onClick={handleSave}
                  style={{ flex: 1, padding: '9px 0', borderRadius: 8, background: '#0BC5DF', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#0899B0'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#0BC5DF'; }}>
                  Guardar cambio
                </button>
                <button onClick={handleCancel}
                  style={{ padding: '9px 12px', borderRadius: 8, background: '#F1F3F4', color: '#5F656A', border: '1px solid #D3D7DA', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #D3D7DA', padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h4 style={{ margin: 0, color: '#203F49' }}>Historial de Cambios</h4>
            <span style={{ background: '#E6F8FB', color: '#0BC5DF', fontSize: 11, fontWeight: 700, borderRadius: 10, padding: '2px 8px' }}>{history.length}</span>
          </div>
          <select value={histFilter === 'all' ? 'all' : String(histFilter)}
            onChange={e => setHistFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid #D3D7DA', background: '#F8F9FA', fontSize: 12, color: '#203F49', cursor: 'pointer' }}>
            <option value="all">Todos los dientes</option>
            {[...new Set(history.map(h => h.toothNumber))].sort((a, b) => a - b).map(n => (
              <option key={n} value={n}>Diente #{n}</option>
            ))}
          </select>
        </div>

        {visibleHistory.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#888F94', fontSize: 13, padding: '24px 0' }}>Sin registros para este diente.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
            {visibleHistory.map(entry => (
              <div key={entry.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', borderRadius: 8, background: '#F8F9FA', border: '1px solid #EAECEE' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E6F8FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#0BC5DF', flexShrink: 0 }}>
                  #{entry.toothNumber}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <StateBadge state={entry.previousState} />
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888F94" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                    <StateBadge state={entry.newState} />
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: '#888F94' }}>{entry.date}</span>
                    <span style={{ fontSize: 11, color: '#888F94' }}>{entry.doctor}</span>
                  </div>
                  {entry.observation && (
                    <p style={{ margin: '3px 0 0', fontSize: 11, color: '#5F656A', fontStyle: 'italic' }}>"{entry.observation}"</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
