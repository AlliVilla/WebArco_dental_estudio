import React, { useState, useEffect, useCallback } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { patientService } from '../../../services/patientService';
import { odontogramaService, mapToFrontendState } from '../services/odontogramaService';
import type { ToothState, ToothData, HistoryEntry } from '../types';
import type { Patient } from '../../../types';

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function getAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

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
  let detail: React.ReactNode;

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
  if (type === 'Requerido') {
    return (
      <span style={{
        color: '#E24B4A', fontSize: 14, fontWeight: 700, lineHeight: 1,
      }}>*</span>
    );
  }
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4,
      background: '#F1F3F4',
      color: '#888F94',
    }}>
      {type}
    </span>
  );
}


// ── Main Screen ───────────────────────────────────────────────────────────────

const ADULT_NUMBERS = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28, 48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const PRIMARY_NUMBERS = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65, 85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

function emptyTeeth(numbers: number[]): Record<number, ToothData> {
  const m: Record<number, ToothData> = {};
  numbers.forEach(n => { m[n] = { number: n, state: 'sano', observation: '' }; });
  return m;
}

export function OdontogramScreen({
  consultaId,
  isEmbedded = false,
  patientName,
  patientIdentidad,
  initialDentition = 'adult',
  onSaveEmbedded,
  onCancelEmbedded,
}: {
  consultaId?: number;
  isEmbedded?: boolean;
  patientName?: string;
  patientIdentidad?: string;
  initialDentition?: 'adult' | 'child';
  onSaveEmbedded?: (updatedTeeth: Record<number, ToothData>, modifiedTeethList: number[]) => void;
  onCancelEmbedded?: () => void;
}) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(!isEmbedded);
  const [loadingOdontogram, setLoadingOdontogram] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<'view' | 'consultation'>(isEmbedded ? 'consultation' : 'view');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [dentition, setDentition] = useState<'adult' | 'child'>(initialDentition);
  const [teeth, setTeeth] = useState<Record<number, ToothData>>(emptyTeeth(ADULT_NUMBERS));
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [modifiedTeethList, setModifiedTeethList] = useState<number[]>([]);

  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [pendingState, setPendingState] = useState<ToothState | ''>('');
  const [pendingObs, setPendingObs] = useState('');
  const [alert, setAlert] = useState<{ type: 'info' | 'success' | 'warning' | 'error'; text: string } | null>(
    { type: 'info', text: 'Selecciona un diente del odontograma para ver o editar su estado clínico.' }
  );
  const [histFilter, setHistFilter] = useState<number | 'all'>('all');
  const [doctorName, setDoctorName] = useState('');

  const currentPatient = patients.find(p => p.id === selectedPatientId) || null;
  const patientAge = currentPatient ? getAge(currentPatient.fecha_nacimiento) : 0;

  const isEditable = mode === 'consultation';

  const toothCount = dentition === 'adult' ? 32 : 20;
  const TODAY = new Date().toISOString().split('T')[0];

  // ── Fetch patients list based on mode ──
  const fetchPatients = useCallback(async (currentMode: 'view' | 'consultation') => {
    if (isEmbedded) return;
    setLoadingPatients(true);
    setError(null);
    try {
      let raw: any[];
      if (currentMode === 'view') {
        const res = await patientService.getAll({ limit: 1000 });
        raw = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
      } else {
        const res = await odontogramaService.getActiveConsultationPatients();
        raw = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
      }
      const mapped: Patient[] = raw.map((p: any) => ({
        id: p.id_persona,
        nombre: [p.primer_nombre, p.segundo_nombre].filter(Boolean).join(' '),
        apellido: [p.primer_apellido, p.segundo_apellido].filter(Boolean).join(' '),
        identidad: p.numero_identidad,
        fecha_nacimiento: p.fecha_nacimiento,
        genero: p.sexo || p.genero,
        telefono: p.telefono,
        correo: p.correo_electronico || p.correo,
        direccion: p.direccion_linea || p.direccion,
      }));
      setPatients(mapped);
      setSelectedPatientId(null);
      setTeeth(emptyTeeth(ADULT_NUMBERS));
      setHistory([]);
      if (mapped.length > 0) {
        setSelectedPatientId(mapped[0].id);
      }
    } catch (err: any) {
      setError(err?.message || 'Error al cargar pacientes');
    } finally {
      setLoadingPatients(false);
    }
  }, [isEmbedded]);

  useEffect(() => {
    fetchPatients(mode);
  }, [mode, fetchPatients]);

  // ── Fetch odontogram data when patient changes ──
  const fetchOdontogram = useCallback(async (patientId: number, dentitionType: 'adult' | 'child') => {
    setLoadingOdontogram(true);
    setError(null);
    try {
      const res = await odontogramaService.getByPatientId(patientId);
      const odontograma = res.data;
      const numbers = dentitionType === 'adult' ? ADULT_NUMBERS : PRIMARY_NUMBERS;
      const toothMap: Record<number, ToothData> = {};
      numbers.forEach(n => { toothMap[n] = { number: n, state: 'sano', observation: '' }; });

      if (odontograma?.dientes) {
        odontograma.dientes.forEach((d: any) => {
          const num = d.numero_diente;
          if (toothMap[num]) {
            toothMap[num] = {
              number: num,
              state: (mapToFrontendState(d.estado) || 'sano') as ToothState,
              observation: d.observacion || '',
            };
          }
        });
      }

      if (odontograma?.dientes) {
        const firstWithDoctor = odontograma.dientes.find((d: any) => d.doctor);
        if (firstWithDoctor?.doctor?.nombre) {
          setDoctorName(firstWithDoctor.doctor.nombre);
        }
      }

      setTeeth(toothMap);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar odontograma');
      setTeeth(emptyTeeth(dentitionType === 'adult' ? ADULT_NUMBERS : PRIMARY_NUMBERS));
    } finally {
      setLoadingOdontogram(false);
    }
  }, []);

  // ── Fetch history when patient changes ──
  const fetchHistory = useCallback(async (patientId: number) => {
    setLoadingHistory(true);
    try {
      const res = await odontogramaService.getHistory(patientId);
      const histData = res.data;
      const rawEntries = (histData?.historial || []).map((item: any, index: number) => {
        const mappedState = (mapToFrontendState(item.estado) || 'sano') as ToothState;
        return {
          id: item.id_odontograma || index,
          toothNumber: item.diente?.numero_diente || 0,
          previousState: null as string | null,
          newState: mappedState,
          observation: item.observacion || '',
          doctor: item.doctor?.nombre || '',
          date: item.fecha_consulta ? item.fecha_consulta.split('T')[0] : '',
          _sort: item.fecha_consulta ? new Date(item.fecha_consulta).getTime() : 0,
        };
      });
      rawEntries.sort((a, b) => a._sort - b._sort);
      const prevMap = new Map<number, string | null>();
      const entries: HistoryEntry[] = rawEntries.map(({ _sort, ...e }) => {
        const prev = prevMap.get(e.toothNumber) ?? null;
        prevMap.set(e.toothNumber, e.newState);
        return { ...e, previousState: prev };
      });
      entries.reverse();
      setHistory(entries);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPatientId && !isEmbedded) {
      const p = patients.find(pj => pj.id === selectedPatientId);
      let resolvedDentition = dentition;
      if (p) {
        const age = getAge(p.fecha_nacimiento);
        resolvedDentition = age < 12 ? 'child' : 'adult';
        setDentition(resolvedDentition);
      }
      fetchOdontogram(selectedPatientId, resolvedDentition);
      fetchHistory(selectedPatientId);
    }
  }, [selectedPatientId, isEmbedded, patients, fetchOdontogram, fetchHistory]);

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

  const handleSave = async () => {
    if (!selectedTooth || !pendingState) {
      setAlert({ type: 'error', text: 'Debes seleccionar un estado antes de guardar el cambio.' }); return;
    }

    setSaving(true);
    try {
      if (!isEmbedded && selectedPatientId) {
        await odontogramaService.saveToothState(
          selectedPatientId,
          selectedTooth,
          pendingState,
          pendingObs,
        );
        await fetchHistory(selectedPatientId);
      }

      setTeeth(prev => ({
        ...prev,
        [selectedTooth]: {
          ...prev[selectedTooth],
          state: pendingState as ToothState,
          observation: pendingObs,
        },
      }));

      if (!modifiedTeethList.includes(selectedTooth)) {
        setModifiedTeethList(prev => [...prev, selectedTooth]);
      }

      setAlert({ type: 'success', text: `Cambio guardado correctamente para el diente #${selectedTooth}.` });
      setSelectedTooth(null); setPendingState(''); setPendingObs('');
    } catch (err: any) {
      setAlert({ type: 'error', text: err?.message || 'Error al guardar el cambio.' });
    } finally {
      setSaving(false);
    }
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

  const showLoading = loadingPatients || loadingOdontogram;

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

      {/* Error banner */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FDF0F0', borderLeft: '4px solid #E24B4A', border: '1px solid #E24B4A', borderRadius: 8, padding: '10px 14px' }}>
          <span style={{ color: '#E24B4A', fontWeight: 700, fontSize: 14 }}>✕</span>
          <span style={{ color: '#E24B4A', fontSize: 13, flex: 1 }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E24B4A', fontSize: 16, opacity: 0.6, padding: 0 }}>×</button>
        </div>
      )}

      {/* Mode toggle (only when not embedded) */}
      {!isEmbedded && (
        <div style={{ display: 'flex', gap: 0, background: '#F1F3F4', borderRadius: 12, padding: 4, alignSelf: 'flex-start' }}>
          <button
            onClick={() => setMode('view')}
            style={{
              padding: '10px 24px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              background: mode === 'view' ? '#fff' : 'transparent',
              color: mode === 'view' ? '#203F49' : '#888F94',
              boxShadow: mode === 'view' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            Visualizar Odontograma
          </button>
          <button
            onClick={() => setMode('consultation')}
            style={{
              padding: '10px 24px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              background: mode === 'consultation' ? '#fff' : 'transparent',
              color: mode === 'consultation' ? '#203F49' : '#888F94',
              boxShadow: mode === 'consultation' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            Editar en Consulta Activa
          </button>
        </div>
      )}

      {/* No active consultations notice */}
      {!isEmbedded && mode === 'consultation' && !loadingPatients && patients.length === 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: '#FFF8EC', border: '1px solid #EF9F27', borderRadius: 12, padding: '16px 20px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF9F27" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div>
            <p style={{ margin: 0, fontWeight: 700, color: '#B45309', fontSize: 14 }}>Sin consultas activas</p>
            <p style={{ margin: '4px 0 0', color: '#92400E', fontSize: 13, lineHeight: 1.4 }}>
              No tienes consultas activas asignadas. Para editar un odontograma, primero debes iniciar una consulta para el paciente desde el expediente clínico.
            </p>
          </div>
        </div>
      )}

      {/* Patient selector (only when not embedded) */}
      {!isEmbedded && (
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #D3D7DA',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20
        }}>
          {/* Left Side: Select and Label */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flex: '1 1 280px',
            background: '#F8F9FA',
            border: '1px solid #EAECEE',
            borderRadius: 12,
            padding: '12px 18px',
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#E6F8FB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0BC5DF',
              flexShrink: 0
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#888F94', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {mode === 'view' ? 'Seleccionar Paciente para ver odontograma' : 'Pacientes con consulta activa'}
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={selectedPatientId ?? ''}
                  onChange={(e) => setSelectedPatientId(Number(e.target.value))}
                  disabled={loadingPatients}
                  style={{
                    width: '100%',
                    padding: '8px 36px 8px 12px',
                    borderRadius: 8,
                    border: '1px solid #D3D7DA',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#203F49',
                    background: '#ffffff',
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none',
                    transition: 'all 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#0BC5DF'}
                  onBlur={e => e.target.style.borderColor = '#D3D7DA'}
                >
                  {loadingPatients ? (
                    <option value="">Cargando pacientes...</option>
                  ) : patients.length === 0 ? (
                    <option value="">No hay pacientes disponibles</option>
                  ) : (
                    patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} {p.apellido} ({getAge(p.fecha_nacimiento)} años)
                      </option>
                    ))
                  )}
                </select>
                <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#888F94' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Validation Alert Badge */}
          {currentPatient && (
            <div style={{
              flex: '1 1 280px',
              background: patientAge < 12 ? '#FFF8EC' : '#E6F8FB',
              border: `1px solid ${patientAge < 12 ? '#EF9F27' : '#0BC5DF'}`,
              borderRadius: 12,
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              transition: 'all 0.2s'
            }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: patientAge < 12 ? '#FFF8EC' : '#E6F8FB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: patientAge < 12 ? '#EF9F27' : '#0BC5DF',
                fontSize: 20,
                flexShrink: 0
              }}>
                {patientAge < 12 ? '🧒' : '🦷'}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: patientAge < 12 ? '#EF9F27' : '#203F49',
                  }}>
                    {patientAge < 12 ? 'Paciente Infantil' : 'Paciente Adulto'}
                  </span>
                  <span style={{
                    background: patientAge < 12 ? '#EF9F27' : '#0BC5DF',
                    color: '#fff',
                    fontSize: 9,
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 6,
                    textTransform: 'uppercase'
                  }}>
                    Validado
                  </span>
                </div>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: patientAge < 12 ? '#B45309' : '#0899B0', lineHeight: 1.3 }}>
                  Edad: <strong>{patientAge} años</strong>. Dentición <strong>{patientAge < 12 ? 'Temporal' : 'Permanente'}</strong> ({patientAge < 12 ? '20' : '32'} piezas).
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading overlay */}
      {showLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, background: '#fff', borderRadius: 12, border: '1px solid #D3D7DA', gap: 12 }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#0BC5DF' }} />
          <span style={{ color: '#888F94', fontSize: 14 }}>
            {loadingPatients ? 'Cargando pacientes...' : 'Cargando odontograma...'}
          </span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <>
          {/* Patient header */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #D3D7DA', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ margin: 0, color: '#203F49' }}>{isEmbedded ? 'Odontograma de la Consulta' : 'Odontograma Interactivo'}</h2>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#888F94' }}>
                  Paciente: <strong style={{ color: '#203F49' }}>{isEmbedded ? (patientName || '—') : (currentPatient ? `${currentPatient.nombre} ${currentPatient.apellido}` : '—')}</strong>
                  &nbsp;·&nbsp; Exp. #{isEmbedded ? (patientIdentidad || '—') : (currentPatient?.identidad || '—')} &nbsp;·&nbsp; Vista oclusal — {toothCount} dientes
                </p>
              </div>
            </div>
            {/* Legend chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, maxWidth: 500, justifyContent: 'flex-end', alignItems: 'center' }}>
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
          <div className="odonto-grid" style={!isEditable ? { gridTemplateColumns: '1fr' } : undefined}>

            {/* Arch SVG */}
            <div className="odonto-svg-card">
              <OdontogramSVG teeth={teeth} selectedTooth={selectedTooth} onSelect={handleSelect} dentition={dentition} />
            </div>

            {/* Action Panel (only in consultation/edit mode) */}
            {isEditable && (
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
                      Estado actual: <StateBadge state={teeth[selectedTooth]?.state} />
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
                  <label style={{ fontSize: 13, color: '#203F49', margin: 0 }}>Estado actual</label>
                </div>
                <div style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #D3D7DA', background: '#F8F9FA', fontSize: 13, color: '#203F49' }}>
                  <StateBadge state={teeth[selectedTooth]?.state} />
                </div>
              </div>

              {isEditable && (
                <>
                  {/* Estado a asignar */}
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

                  {/* Observación */}
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
                      <div style={{ padding: '6px 10px', borderRadius: 8, background: '#F1F3F4', border: '1px solid #EAECEE', fontSize: 11, color: '#5F656A' }}>{doctorName || '—'}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#888F94', display: 'block', marginBottom: 4 }}>Fecha del cambio</label>
                      <div style={{ padding: '6px 10px', borderRadius: 8, background: '#F1F3F4', border: '1px solid #EAECEE', fontSize: 11, color: '#5F656A' }}>{TODAY}</div>
                    </div>
                  </div>

                  {/* Botones */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
                    <button onClick={handleSave} disabled={saving}
                      style={{ flex: 1, padding: '9px 0', borderRadius: 8, background: saving ? '#B0E0E8' : '#0BC5DF', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}
                      onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLButtonElement).style.background = '#0899B0'; }}
                      onMouseLeave={e => { if (!saving) (e.currentTarget as HTMLButtonElement).style.background = '#0BC5DF'; }}>
                      {saving ? 'Guardando...' : 'Guardar cambio'}
                    </button>
                    <button onClick={handleCancel}
                      style={{ padding: '9px 12px', borderRadius: 8, background: '#F1F3F4', color: '#5F656A', border: '1px solid #D3D7DA', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                      Cancelar
                    </button>
                  </div>
                </>
              )}

            </div>
          )}
            </div>
          )}
            </div>

          {/* History */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #D3D7DA', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h4 style={{ margin: 0, color: '#203F49' }}>Historial de Cambios</h4>
                <span style={{ background: '#E6F8FB', color: '#0BC5DF', fontSize: 11, fontWeight: 700, borderRadius: 10, padding: '2px 8px' }}>
                  {loadingHistory ? '...' : history.length}
                </span>
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
                        <p style={{ margin: '3px 0 0', fontSize: 11, color: '#5F656A', fontStyle: 'italic', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>"{entry.observation}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {isEmbedded && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, padding: '16px 0', borderTop: `1px solid #D3D7DA` }}>
          <button
            onClick={() => onSaveEmbedded?.(teeth, modifiedTeethList)}
            style={{ padding: '12px 24px', borderRadius: 8, background: '#1D9E75', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#17805E'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1D9E75'; }}
          >
            <Check size={16} /> Guardar Odontograma de la Consulta
          </button>
          <button
            onClick={onCancelEmbedded}
            style={{ padding: '12px 20px', borderRadius: 8, background: '#fff', color: '#5F656A', border: '1px solid #D3D7DA', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
          >
            Cancelar y Volver
          </button>
        </div>
      )}
    </div>
  );
}
