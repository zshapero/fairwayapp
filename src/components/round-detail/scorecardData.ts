export interface HoleData {
  holeNumber: number;
  par: number;
  yardage: number | null;
  /** Player's gross strokes on the hole, or null if not recorded. */
  strokes: number | null;
}

const PARTIAL_PAR_DEFAULTS: number[] = [
  4, 4, 4, 4, 3, 4, 4, 4, 5, 4, 4, 3, 4, 5, 4, 4, 3, 4,
];

function placeholderHoles(numHoles: number): HoleData[] {
  return Array.from({ length: numHoles }, (_, i) => ({
    holeNumber: i + 1,
    par: PARTIAL_PAR_DEFAULTS[i] ?? 4,
    yardage: null,
    strokes: null,
  }));
}

export interface ScorecardComputed {
  front: HoleData[];
  back: HoleData[];
  nineHoleOnly: boolean;
  totalStrokes: number;
  totalPar: number;
}

function totalStrokes(holes: HoleData[]): number {
  return holes.reduce((sum, h) => sum + (h.strokes ?? 0), 0);
}

function totalPar(holes: HoleData[]): number {
  return holes.reduce((sum, h) => sum + h.par, 0);
}

/** Pure helper used by both the Scorecard component and tests. */
export function buildScorecard(
  holes: HoleData[],
  numHolesPlayed: number,
): ScorecardComputed {
  const all = holes.length > 0 ? holes : placeholderHoles(numHolesPlayed);
  const front = all.slice(0, 9);
  const back = all.slice(9, 18);
  const totalsHoles = numHolesPlayed === 9 ? front : [...front, ...back];
  return {
    front,
    back,
    nineHoleOnly: numHolesPlayed === 9,
    totalStrokes: totalStrokes(totalsHoles),
    totalPar: totalPar(totalsHoles),
  };
}
