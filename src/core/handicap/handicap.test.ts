import { describe, it, expect } from 'vitest';
import {
  netDoubleBogey,
  strokesReceivedOnHole,
  adjustedGrossScore,
  scoreDifferential,
  handicapIndex,
  courseHandicap,
  exceptionalScoreReduction,
  calculateExpectedScore,
} from './index';
import type { HoleScore, RoundInput } from './types';

// Source for all WHS rules referenced below: USGA Rules of Handicapping (2024).
// https://www.usga.org/handicapping/roh/2024-rules-of-handicapping.html

const par4Course = (): HoleScore[] =>
  Array.from({ length: 18 }, (_, i) => ({
    holeNumber: i + 1,
    par: 4,
    strokes: 4,
    strokeIndex: i + 1,
  }));

describe('netDoubleBogey', () => {
  // Rule 3.1: par-4 with one stroke received → 4 + 2 + 1 = 7.
  it('par 4 with one stroke received is 7', () => {
    expect(netDoubleBogey(4, 1)).toBe(7);
  });
  it('par 5 with no strokes received is 7', () => {
    expect(netDoubleBogey(5, 0)).toBe(7);
  });
  it('par 3 with two strokes received is 7', () => {
    expect(netDoubleBogey(3, 2)).toBe(7);
  });
});

describe('strokesReceivedOnHole', () => {
  // Rule 6.2 / Appendix C: stroke allocation by stroke index.
  it('zero handicap receives zero strokes', () => {
    expect(strokesReceivedOnHole(0, 1)).toBe(0);
    expect(strokesReceivedOnHole(0, 18)).toBe(0);
  });

  it('positive handicap distributes lowest stroke index first', () => {
    // CH = 10: stroke indexes 1..10 get 1 stroke, 11..18 get 0.
    expect(strokesReceivedOnHole(10, 1)).toBe(1);
    expect(strokesReceivedOnHole(10, 10)).toBe(1);
    expect(strokesReceivedOnHole(10, 11)).toBe(0);
    expect(strokesReceivedOnHole(10, 18)).toBe(0);
  });

  it('handicap above 18 wraps a second stroke', () => {
    // CH = 20: stroke indexes 1 and 2 get 2 strokes, others get 1.
    expect(strokesReceivedOnHole(20, 1)).toBe(2);
    expect(strokesReceivedOnHole(20, 2)).toBe(2);
    expect(strokesReceivedOnHole(20, 3)).toBe(1);
    expect(strokesReceivedOnHole(20, 18)).toBe(1);
  });

  it('plus handicap returns strokes starting at easiest hole', () => {
    // CH = -2 (a "+2"): stroke indexes 17 and 18 give back 1 stroke.
    expect(strokesReceivedOnHole(-2, 18)).toBe(-1);
    expect(strokesReceivedOnHole(-2, 17)).toBe(-1);
    expect(strokesReceivedOnHole(-2, 16)).toBe(0);
    expect(strokesReceivedOnHole(-2, 1)).toBe(0);
  });

  it('plus 1 returns one stroke only on stroke index 18', () => {
    expect(strokesReceivedOnHole(-1, 18)).toBe(-1);
    expect(strokesReceivedOnHole(-1, 17)).toBe(0);
  });
});

describe('adjustedGrossScore', () => {
  // Rule 3.1: per-hole strokes capped at Net Double Bogey.
  it('caps blow-up holes at net double bogey', () => {
    const holes = par4Course();
    holes[0] = { holeNumber: 1, par: 4, strokes: 12, strokeIndex: 1 };
    const round: RoundInput = {
      holeScores: holes,
      courseRating: 72,
      slopeRating: 113,
      pcc: 0,
      courseHandicap: 18, // 1 stroke per hole → NDB = 7 per hole.
    };
    // 17 holes at 4, plus capped 7 = 75.
    expect(adjustedGrossScore(round)).toBe(17 * 4 + 7);
  });

  it('returns sum of strokes when no hole exceeds cap', () => {
    const holes = par4Course().map((h) => ({ ...h, strokes: 5 }));
    const round: RoundInput = {
      holeScores: holes,
      courseRating: 72,
      slopeRating: 113,
      pcc: 0,
      courseHandicap: 18,
    };
    expect(adjustedGrossScore(round)).toBe(90);
  });
});

describe('scoreDifferential', () => {
  // Rule 5.1: Score Differential = (113 / Slope) * (AGS - CR - PCC),
  // rounded to 1 decimal.
  // Worked example: AGS = 95, CR = 71.2, Slope = 137, PCC = 0
  // → (113 / 137) * (95 - 71.2) = 19.6
  it('matches the USGA worked example to one decimal place', () => {
    const holes = par4Course().map((h, i) => ({
      ...h,
      strokes: i < 5 ? 6 : 5, // 5 sixes + 13 fives = 95.
    }));
    const round: RoundInput = {
      holeScores: holes,
      courseRating: 71.2,
      slopeRating: 137,
      pcc: 0,
      courseHandicap: 18, // NDB = 7 per hole; no cap triggered.
    };
    expect(adjustedGrossScore(round)).toBe(95);
    expect(scoreDifferential(round)).toBe(19.6);
  });

  it('applies PCC adjustment to the differential', () => {
    const holes = par4Course().map((h) => ({ ...h, strokes: 5 })); // AGS = 90.
    const round: RoundInput = {
      holeScores: holes,
      courseRating: 72,
      slopeRating: 113,
      pcc: 1,
      courseHandicap: 18,
    };
    // (113/113) * (90 - 72 - 1) = 17.0
    expect(scoreDifferential(round)).toBe(17.0);
  });
});

describe('handicapIndex', () => {
  // Rule 5.2 / Table 5.2a.
  it('returns null with fewer than 3 differentials', () => {
    expect(handicapIndex([])).toBeNull();
    expect(handicapIndex([10.0])).toBeNull();
    expect(handicapIndex([10.0, 12.0])).toBeNull();
  });

  it('uses lowest 1 minus 2.0 for exactly 3 differentials', () => {
    expect(handicapIndex([10.0, 12.0, 15.0])).toBe(8.0);
  });

  it('uses lowest 1 minus 1.0 for exactly 4 differentials', () => {
    expect(handicapIndex([10.0, 12.0, 15.0, 16.0])).toBe(9.0);
  });

  it('uses lowest 1 with no adjustment for 5 differentials', () => {
    expect(handicapIndex([10.0, 12.0, 15.0, 16.0, 17.0])).toBe(10.0);
  });

  it('uses average of lowest 2 minus 1.0 for 6 differentials', () => {
    // (10 + 12) / 2 - 1 = 10.0
    expect(handicapIndex([10.0, 12.0, 15.0, 16.0, 17.0, 18.0])).toBe(10.0);
  });

  it('uses average of lowest 3 for 9–11 differentials', () => {
    const diffs = [10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0, 17.0, 18.0];
    // (10 + 11 + 12) / 3 = 11.0
    expect(handicapIndex(diffs)).toBe(11.0);
  });

  it('uses average of lowest 8 for 20 differentials', () => {
    const diffs = Array.from({ length: 20 }, (_, i) => 10.0 + i);
    // Lowest 8 are 10..17, average = 13.5.
    expect(handicapIndex(diffs)).toBe(13.5);
  });

  it('uses only the most recent 20 when given more', () => {
    const oldExtras = [0.0, 0.1, 0.2]; // would dominate if not sliced off.
    const recent20 = Array.from({ length: 20 }, (_, i) => 10.0 + i);
    expect(handicapIndex([...oldExtras, ...recent20])).toBe(13.5);
  });
});

describe('courseHandicap', () => {
  // Rule 6.1: CH = round(HI * Slope / 113 + (CR - Par)).
  // Worked example: HI = 10.4, Slope = 125, CR = 72.1, Par = 72
  // → 10.4 * 125 / 113 + 0.1 = 11.6044... → 12
  it('matches the USGA worked example', () => {
    expect(courseHandicap(10.4, 125, 72.1, 72)).toBe(12);
  });

  it('returns 0 for scratch player on neutral course', () => {
    expect(courseHandicap(0, 113, 72, 72)).toBe(0);
  });

  it('handles plus handicaps', () => {
    // HI = -2.0, Slope 125, CR 71.0, Par 72 → -2 * 125/113 + (-1) = -3.21 → -3
    expect(courseHandicap(-2.0, 125, 71.0, 72)).toBe(-3);
  });
});

describe('exceptionalScoreReduction', () => {
  // Rule 5.9: delta in [7.0, 9.9] → 1, delta >= 10.0 → 2, else 0.
  it('returns 0 when differential is not exceptional', () => {
    expect(exceptionalScoreReduction(10.0, 12.0)).toBe(0);
    expect(exceptionalScoreReduction(5.1, 12.0)).toBe(0); // delta 6.9
  });

  it('returns 1 when differential is 7.0 to 9.9 below current index', () => {
    expect(exceptionalScoreReduction(5.0, 12.0)).toBe(1); // delta 7.0
    expect(exceptionalScoreReduction(2.1, 12.0)).toBe(1); // delta 9.9
  });

  it('returns 2 when differential is 10.0 or more below current index', () => {
    expect(exceptionalScoreReduction(2.0, 12.0)).toBe(2); // delta 10.0
    expect(exceptionalScoreReduction(0.0, 15.0)).toBe(2); // delta 15.0
  });
});

describe('calculateExpectedScore', () => {
  // HI 14.0, slope 130, CR 71.5, par 72 → CH = round(14 * 130/113 + (71.5 - 72)) = 16.
  // Expected base = 72 + 16 = 88.
  it('returns base expected score with no weather', () => {
    expect(calculateExpectedScore(14.0, 71.5, 130, 72)).toBe(88);
    expect(calculateExpectedScore(14.0, 71.5, 130, 72, null)).toBe(88);
  });

  it('adds nothing under 10 mph wind', () => {
    expect(
      calculateExpectedScore(14.0, 71.5, 130, 72, { windSpeedMph: 8 }),
    ).toBe(88);
  });

  it('adds 1 stroke per 10 mph over 10 mph (capped at +3)', () => {
    expect(
      calculateExpectedScore(14.0, 71.5, 130, 72, { windSpeedMph: 20 }),
    ).toBe(89);
    expect(
      calculateExpectedScore(14.0, 71.5, 130, 72, { windSpeedMph: 30 }),
    ).toBe(90);
    expect(
      calculateExpectedScore(14.0, 71.5, 130, 72, { windSpeedMph: 60 }),
    ).toBe(91); // capped at +3
  });

  it('adds 0.5 to 1 stroke when below 50°F', () => {
    // 49°F → +0.5 + (50-49)/40 = 0.525 → 88.5 → rounds to 89
    expect(
      calculateExpectedScore(14.0, 71.5, 130, 72, { temperatureF: 49 }),
    ).toBe(89);
    // 10°F → cap at +1 → 89
    expect(
      calculateExpectedScore(14.0, 71.5, 130, 72, { temperatureF: 10 }),
    ).toBe(89);
    expect(
      calculateExpectedScore(14.0, 71.5, 130, 72, { temperatureF: 60 }),
    ).toBe(88);
  });

  it('adds 1 stroke for rain or snow', () => {
    expect(
      calculateExpectedScore(14.0, 71.5, 130, 72, { condition: 'rain' }),
    ).toBe(89);
    expect(
      calculateExpectedScore(14.0, 71.5, 130, 72, { condition: 'snow' }),
    ).toBe(89);
    expect(
      calculateExpectedScore(14.0, 71.5, 130, 72, { condition: 'clear' }),
    ).toBe(88);
  });

  it('combines penalties: 25 mph + 45°F + rain', () => {
    // wind +1.5, cold +0.5+5/40=0.625, rain +1 → 88 + 3.125 → 91
    expect(
      calculateExpectedScore(14.0, 71.5, 130, 72, {
        windSpeedMph: 25,
        temperatureF: 45,
        condition: 'rain',
      }),
    ).toBe(91);
  });

  it('handles null fields gracefully', () => {
    expect(
      calculateExpectedScore(14.0, 71.5, 130, 72, {
        windSpeedMph: null,
        temperatureF: null,
        condition: null,
      }),
    ).toBe(88);
  });
});
