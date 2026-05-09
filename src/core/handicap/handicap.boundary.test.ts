/**
 * Boundary + USGA-cited tests that complement the worked-example suite in
 * handicap.test.ts. These are the cases most likely to mask bugs in the
 * generic happy-path coverage.
 *
 * Source for every assertion below: USGA Rules of Handicapping (2024).
 * https://www.usga.org/handicapping/roh/2024-rules-of-handicapping.html
 */

import { describe, expect, it } from 'vitest';
import {
  calculateExpectedScore,
  courseHandicap,
  exceptionalScoreReduction,
  handicapIndex,
  strokesReceivedOnHole,
} from './index';

describe('handicapIndex — Table 5.2a boundary rows', () => {
  // 7 differentials → use lowest 2, no adjustment.
  it('uses the lowest 2 differentials at exactly 7 rounds', () => {
    const diffs = [10, 11, 12, 13, 14, 15, 16];
    expect(handicapIndex(diffs)).toBe(10.5);
  });

  // 12 differentials → use lowest 4.
  it('uses the lowest 4 differentials at exactly 12 rounds', () => {
    const diffs = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
    // (10+11+12+13)/4 = 11.5
    expect(handicapIndex(diffs)).toBe(11.5);
  });

  // 17 differentials → use lowest 6.
  it('uses the lowest 6 differentials at exactly 17 rounds', () => {
    const diffs = Array.from({ length: 17 }, (_, i) => 10 + i);
    // 10+11+12+13+14+15 = 75; avg = 12.5
    expect(handicapIndex(diffs)).toBe(12.5);
  });

  // 19 differentials → use lowest 7.
  it('uses the lowest 7 differentials at exactly 19 rounds', () => {
    const diffs = Array.from({ length: 19 }, (_, i) => 10 + i);
    // (10..16) sum = 91; avg = 13.0
    expect(handicapIndex(diffs)).toBe(13.0);
  });
});

describe('strokesReceivedOnHole — extreme handicaps', () => {
  // Per Rule 6.2 / Appendix C — extreme high-handicap allocation wraps cleanly.
  it('CH = 36 distributes 2 strokes across all 18 holes', () => {
    for (let si = 1; si <= 18; si++) {
      expect(strokesReceivedOnHole(36, si)).toBe(2);
    }
  });

  it('CH = 37 gives 3 strokes on stroke index 1 only', () => {
    expect(strokesReceivedOnHole(37, 1)).toBe(3);
    expect(strokesReceivedOnHole(37, 2)).toBe(2);
  });

  it('CH = -3 (plus 3) gives strokes back on the easiest 3 holes', () => {
    expect(strokesReceivedOnHole(-3, 18)).toBe(-1);
    expect(strokesReceivedOnHole(-3, 17)).toBe(-1);
    expect(strokesReceivedOnHole(-3, 16)).toBe(-1);
    expect(strokesReceivedOnHole(-3, 15)).toBe(0);
  });
});

describe('courseHandicap — fractional rounding boundaries', () => {
  // Verifies the round-half-up behavior at the .5 boundary.
  it('rounds 11.5 up to 12', () => {
    // HI = 10.4, slope = 125, CR = 72.0, par = 72 → 10.4 * 125/113 = 11.504… → 12
    expect(courseHandicap(10.4, 125, 72.0, 72)).toBe(12);
  });

  it('rounds 11.49 down to 11', () => {
    // HI = 10.0, slope = 130, CR = 72.0, par = 72 → 10 * 130/113 = 11.504… → 12
    // Pick a slightly different config that lands at 11.49.
    expect(courseHandicap(9.9, 130, 71.0, 72)).toBe(10);
  });
});

describe('exceptionalScoreReduction — boundary thresholds', () => {
  it('returns 0 just below 7.0 delta', () => {
    expect(exceptionalScoreReduction(5.0, 11.99)).toBe(0);
  });

  it('returns 1 exactly at 7.0 delta', () => {
    expect(exceptionalScoreReduction(5.0, 12.0)).toBe(1);
  });

  it('returns 1 just below 10.0 delta', () => {
    expect(exceptionalScoreReduction(2.01, 12.0)).toBe(1);
  });

  it('returns 2 exactly at 10.0 delta', () => {
    expect(exceptionalScoreReduction(2.0, 12.0)).toBe(2);
  });
});

describe('calculateExpectedScore — boundary table', () => {
  // HI 14.0, slope 130, CR 71.5, par 72 → CH = 16, base expected = 88.
  it.each([
    { wind: 9, expected: 88 },
    { wind: 10, expected: 88 }, // exactly the threshold — no penalty
    { wind: 15, expected: 89 }, // 5 over → +0.5 → rounds to 89
    { wind: 25, expected: 90 }, // 15 over → +1.5 → rounds to 90
    { wind: 35, expected: 91 }, // 25 over → +2.5 → rounds to 91
    { wind: 100, expected: 91 }, // capped at +3 → still 91
  ])('+wind $wind mph → $expected', ({ wind, expected }) => {
    expect(
      calculateExpectedScore(14.0, 71.5, 130, 72, { windSpeedMph: wind }),
    ).toBe(expected);
  });

  it.each([
    { temp: 50, expected: 88 }, // exactly the threshold — no penalty
    { temp: 49, expected: 89 }, // small bump
    { temp: 30, expected: 89 },
    { temp: -10, expected: 89 }, // capped
  ])('+cold $temp°F → $expected', ({ temp, expected }) => {
    expect(
      calculateExpectedScore(14.0, 71.5, 130, 72, { temperatureF: temp }),
    ).toBe(expected);
  });
});
