import type { RoundInput } from './types';

export type { HoleScore, RoundInput } from './types';

/**
 * Net Double Bogey is the maximum hole score used for handicap purposes:
 * par + 2 strokes + any handicap strokes received on the hole.
 *
 * Source: USGA Rules of Handicapping, Rule 3.1 — Acceptable Score Format.
 * https://www.usga.org/handicapping/roh/2024-rules-of-handicapping.html
 */
export function netDoubleBogey(par: number, strokesReceived: number): number {
  return par + 2 + strokesReceived;
}

/**
 * Strokes received on a hole given a Course Handicap and the hole's stroke
 * index. Handles positive, zero, and plus (negative) handicaps.
 *
 * Positive handicaps: strokes are allocated lowest stroke index (hardest
 * hole) first. Plus handicaps: strokes are returned starting at stroke
 * index 18 (easiest hole) first.
 *
 * Source: USGA Rules of Handicapping, Rule 6.2 / Appendix C — Stroke
 * Allocation. https://www.usga.org/handicapping/roh/2024-rules-of-handicapping.html
 */
export function strokesReceivedOnHole(
  courseHandicap: number,
  strokeIndex: number,
): number {
  if (courseHandicap === 0) return 0;
  // Math-floor modulo so the formula works for negative (plus) handicaps.
  const base = Math.floor(courseHandicap / 18);
  const remainder = courseHandicap - base * 18;
  return base + (strokeIndex - 1 < remainder ? 1 : 0);
}

/**
 * Adjusted Gross Score: sum of per-hole strokes, with each hole capped at
 * Net Double Bogey for the player's strokes received on that hole.
 *
 * Source: USGA Rules of Handicapping, Rule 3.1.
 */
export function adjustedGrossScore(round: RoundInput): number {
  let total = 0;
  for (const hole of round.holeScores) {
    const strokesReceived = strokesReceivedOnHole(
      round.courseHandicap,
      hole.strokeIndex,
    );
    const cap = netDoubleBogey(hole.par, strokesReceived);
    total += Math.min(hole.strokes, cap);
  }
  return total;
}

/**
 * Score Differential for a round, rounded to 1 decimal place:
 *   (113 / Slope) * (AGS - Course Rating - PCC)
 *
 * Source: USGA Rules of Handicapping, Rule 5.1 — Score Differential.
 * https://www.usga.org/handicapping/roh/2024-rules-of-handicapping.html
 */
export function scoreDifferential(round: RoundInput): number {
  const ags = adjustedGrossScore(round);
  const raw = (113 / round.slopeRating) * (ags - round.courseRating - round.pcc);
  return Math.round(raw * 10) / 10;
}

interface HandicapTableRow {
  count: number;
  adjustment: number;
}

// Number of lowest differentials to use, and adjustment applied, by rounds available.
// Source: USGA Rules of Handicapping, Rule 5.2, Table 5.2a.
// https://www.usga.org/handicapping/roh/2024-rules-of-handicapping.html
const HANDICAP_TABLE: Record<number, HandicapTableRow> = {
  3: { count: 1, adjustment: -2.0 },
  4: { count: 1, adjustment: -1.0 },
  5: { count: 1, adjustment: 0 },
  6: { count: 2, adjustment: -1.0 },
  7: { count: 2, adjustment: 0 },
  8: { count: 2, adjustment: 0 },
  9: { count: 3, adjustment: 0 },
  10: { count: 3, adjustment: 0 },
  11: { count: 3, adjustment: 0 },
  12: { count: 4, adjustment: 0 },
  13: { count: 4, adjustment: 0 },
  14: { count: 4, adjustment: 0 },
  15: { count: 5, adjustment: 0 },
  16: { count: 5, adjustment: 0 },
  17: { count: 6, adjustment: 0 },
  18: { count: 6, adjustment: 0 },
  19: { count: 7, adjustment: 0 },
  20: { count: 8, adjustment: 0 },
};

/**
 * Handicap Index from a list of acceptable Score Differentials. Uses only
 * the most recent 20 (caller is responsible for ordering — pass them in
 * recency order, most recent first or last; they are sorted ascending here
 * after slicing). Returns null if fewer than 3 differentials are available.
 *
 * Source: USGA Rules of Handicapping, Rule 5.2 — Calculation of a
 * Handicap Index, including Table 5.2a.
 * https://www.usga.org/handicapping/roh/2024-rules-of-handicapping.html
 */
export function handicapIndex(differentials: number[]): number | null {
  const recent = differentials.slice(-20);
  const n = recent.length;
  if (n < 3) return null;
  const row = HANDICAP_TABLE[Math.min(n, 20)];
  const sorted = [...recent].sort((a, b) => a - b);
  const lowest = sorted.slice(0, row.count);
  const avg = lowest.reduce((s, x) => s + x, 0) / row.count;
  return Math.round((avg + row.adjustment) * 10) / 10;
}

/**
 * Course Handicap for a player given their Handicap Index and the tee's
 * Course Rating, Slope Rating, and Par.
 *
 *   CH = round(HI * Slope / 113 + (Course Rating - Par))
 *
 * Source: USGA Rules of Handicapping, Rule 6.1 — Course Handicap.
 * https://www.usga.org/handicapping/roh/2024-rules-of-handicapping.html
 */
export function courseHandicap(
  handicapIndexValue: number,
  slopeRating: number,
  courseRating: number,
  par: number,
): number {
  const raw = handicapIndexValue * (slopeRating / 113) + (courseRating - par);
  return Math.round(raw);
}

/**
 * Exceptional Score Reduction: the magnitude (0, 1, or 2) by which a
 * player's Handicap Index is reduced when a single Score Differential is
 * exceptionally low compared to the current Handicap Index.
 *
 *   delta = currentIndex - newDifferential
 *   delta in [7.0, 9.9]  → 1
 *   delta >= 10.0         → 2
 *   otherwise             → 0
 *
 * Source: USGA Rules of Handicapping, Rule 5.9 — Exceptional Score
 * Reduction. https://www.usga.org/handicapping/roh/2024-rules-of-handicapping.html
 */
export function exceptionalScoreReduction(
  newDifferential: number,
  currentIndex: number,
): 0 | 1 | 2 {
  const delta = currentIndex - newDifferential;
  if (delta >= 10.0) return 2;
  if (delta >= 7.0) return 1;
  return 0;
}
