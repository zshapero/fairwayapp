/** Score-to-par classification used for scorecard color washes and labels. */
export type ScoreClass =
  | 'eagle-or-better'
  | 'birdie'
  | 'par'
  | 'bogey'
  | 'double-bogey'
  | 'triple-or-worse';

export function classifyScore(strokes: number, par: number): ScoreClass {
  const diff = strokes - par;
  if (diff <= -2) return 'eagle-or-better';
  if (diff === -1) return 'birdie';
  if (diff === 0) return 'par';
  if (diff === 1) return 'bogey';
  if (diff === 2) return 'double-bogey';
  return 'triple-or-worse';
}

export interface ScoreVisual {
  /** RGBA background fill behind the number. Empty string = no fill. */
  background: string;
  /** When true, render the number in a heavier weight. */
  bolder: boolean;
}

/**
 * Watercolor-style washes used to tint each hole's score circle. Tuned to
 * sit comfortably on a cream background without dominating it.
 */
export function visualForScore(klass: ScoreClass): ScoreVisual {
  switch (klass) {
    case 'eagle-or-better':
      return { background: 'rgba(184, 150, 90, 0.40)', bolder: true };
    case 'birdie':
      return { background: 'rgba(156, 196, 168, 0.50)', bolder: true };
    case 'par':
      return { background: '', bolder: false };
    case 'bogey':
      return { background: 'rgba(232, 216, 184, 0.60)', bolder: false };
    case 'double-bogey':
      return { background: 'rgba(212, 168, 126, 0.60)', bolder: false };
    case 'triple-or-worse':
      return { background: 'rgba(201, 135, 107, 0.50)', bolder: false };
  }
}

/** Format a score relative to par as "+5", "−2", or "E". */
export function formatToPar(diff: number): string {
  if (diff === 0) return 'E';
  if (diff > 0) return `+${diff}`;
  // Use minus sign rather than hyphen for typographic correctness.
  return `−${Math.abs(diff)}`;
}
