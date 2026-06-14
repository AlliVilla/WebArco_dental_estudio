import type { ToothData, HistoryEntry } from '../types';

const DRAFT_PREFIX = 'webarco_odontograma_draft';

export interface OdontogramaDraft {
  teeth: Record<number, ToothData>;
  modifiedTeethList: number[];
  sessionHistory: HistoryEntry[];
  updatedAt: string;
}

export function getOdontogramaDraftKey(patientId: number): string {
  return `${DRAFT_PREFIX}_${patientId}`;
}

export function loadOdontogramaDraft(patientId: number): OdontogramaDraft | null {
  try {
    const raw = window.localStorage.getItem(getOdontogramaDraftKey(patientId));
    if (!raw) return null;
    return JSON.parse(raw) as OdontogramaDraft;
  } catch {
    return null;
  }
}

export function saveOdontogramaDraft(patientId: number, draft: OdontogramaDraft): void {
  try {
    window.localStorage.setItem(
      getOdontogramaDraftKey(patientId),
      JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }),
    );
  } catch {
    /* ignore quota errors */
  }
}

export function clearOdontogramaDraft(patientId: number): void {
  try {
    window.localStorage.removeItem(getOdontogramaDraftKey(patientId));
  } catch {
    /* ignore */
  }
}

export function getDraftTooth(
  teeth: Record<string | number, ToothData>,
  toothNum: number,
): ToothData | undefined {
  return teeth[toothNum] ?? teeth[String(toothNum)];
}

export function applyDraftToToothMap(
  toothMap: Record<number, ToothData>,
  draft: OdontogramaDraft,
): void {
  draft.modifiedTeethList.forEach((num) => {
    const toothNum = Number(num);
    const draftTooth = getDraftTooth(draft.teeth, toothNum);
    if (toothMap[toothNum] && draftTooth) {
      toothMap[toothNum] = { ...draftTooth, number: toothNum };
    }
  });
}

export function buildDraftPayload(
  teeth: Record<number, ToothData>,
  modifiedTeethList: number[],
  sessionHistory: HistoryEntry[],
): OdontogramaDraft {
  const draftTeeth: Record<number, ToothData> = {};
  modifiedTeethList.forEach((num) => {
    if (teeth[num]) {
      draftTeeth[num] = { ...teeth[num], number: num };
    }
  });
  return {
    teeth: draftTeeth,
    modifiedTeethList,
    sessionHistory,
    updatedAt: new Date().toISOString(),
  };
}
