import { describe, expect, it } from 'vitest';
import { buildScorecard, type HoleData } from '../scorecardData';

function hole(n: number, par: number, strokes: number | null): HoleData {
  return { holeNumber: n, par, yardage: 350 + n, strokes };
}

describe('buildScorecard', () => {
  it('splits 18 holes into front and back nines', () => {
    const holes: HoleData[] = Array.from({ length: 18 }, (_, i) => hole(i + 1, 4, 5));
    const built = buildScorecard(holes, 18);
    expect(built.front).toHaveLength(9);
    expect(built.back).toHaveLength(9);
    expect(built.totalStrokes).toBe(90);
    expect(built.totalPar).toBe(72);
    expect(built.nineHoleOnly).toBe(false);
  });

  it('marks 9-hole rounds as nineHoleOnly and totals only the front 9', () => {
    const holes: HoleData[] = Array.from({ length: 9 }, (_, i) => hole(i + 1, 4, 5));
    const built = buildScorecard(holes, 9);
    expect(built.nineHoleOnly).toBe(true);
    expect(built.totalStrokes).toBe(45);
  });

  it('falls back to placeholder par values when no per-hole data is available', () => {
    const built = buildScorecard([], 18);
    expect(built.front).toHaveLength(9);
    expect(built.back).toHaveLength(9);
    // Placeholder strokes should be null so the cell shows "—".
    expect(built.front[0].strokes).toBeNull();
    expect(built.totalStrokes).toBe(0);
  });
});
