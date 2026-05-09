import { describe, expect, it } from 'vitest';
import {
  buildTendency,
  generateHoleStrategies,
  generateHoleStrategy,
  type HolePlay,
  type HolePlaysInput,
} from '../holeStrategy';

function play(
  strokes: number,
  opts: Partial<HolePlay> = {},
): HolePlay {
  return {
    strokes,
    fairwayHit: opts.fairwayHit ?? null,
    greenInRegulation: opts.greenInRegulation ?? null,
    putts: opts.putts ?? null,
    fairwayMissDirection: opts.fairwayMissDirection,
    greenMissDirection: opts.greenMissDirection,
  };
}

describe('generateHoleStrategy', () => {
  it('returns null when fewer than 3 plays', () => {
    expect(
      generateHoleStrategy({ holeNumber: 1, par: 4, plays: [play(5), play(4)] }),
    ).toBeNull();
  });

  it('computes averages, best, hit rates, and average putts', () => {
    const input: HolePlaysInput = {
      holeNumber: 5,
      par: 4,
      plays: [
        play(5, { fairwayHit: true, greenInRegulation: true, putts: 2 }),
        play(6, { fairwayHit: false, greenInRegulation: false, putts: 3 }),
        play(4, { fairwayHit: true, greenInRegulation: true, putts: 2 }),
      ],
    };
    const s = generateHoleStrategy(input)!;
    expect(s.holeNumber).toBe(5);
    expect(s.averageScore).toBe(5);
    expect(s.averageOverPar).toBe(1);
    expect(s.bestEverScore).toBe(4);
    expect(s.playsCount).toBe(3);
    expect(s.fairwayHitRate).toBeCloseTo(2 / 3, 5);
    expect(s.girHitRate).toBeCloseTo(2 / 3, 5);
    expect(s.averagePutts).toBeCloseTo(2.3, 1);
  });

  it('returns null hit rates when no fairway / GIR / putt data was ever recorded', () => {
    const input: HolePlaysInput = {
      holeNumber: 1,
      par: 4,
      plays: [play(5), play(5), play(6)],
    };
    const s = generateHoleStrategy(input)!;
    expect(s.fairwayHitRate).toBeNull();
    expect(s.girHitRate).toBeNull();
    expect(s.averagePutts).toBeNull();
  });

  it('flags a "this hole suits you" tendency when 3+ of last 5 are par or better', () => {
    const input: HolePlaysInput = {
      holeNumber: 7,
      par: 4,
      plays: [play(5), play(4), play(4), play(4), play(5)], // 3 of 5 at par
    };
    const s = generateHoleStrategy(input)!;
    expect(s.tendency).toContain('This hole suits you');
  });

  it('flags a directional miss tendency when ≥3 of last 5 misses are the same way', () => {
    const input: HolePlaysInput = {
      holeNumber: 12,
      par: 4,
      plays: [
        play(5, { fairwayHit: false, fairwayMissDirection: 'right' }),
        play(5, { fairwayHit: false, fairwayMissDirection: 'right' }),
        play(5, { fairwayHit: true }),
        play(5, { fairwayHit: false, fairwayMissDirection: 'right' }),
        play(6, { fairwayHit: false, fairwayMissDirection: 'right' }),
      ],
    };
    const s = generateHoleStrategy(input)!;
    expect(s.commonFairwayMissDirection).toBe('right');
    expect(s.tendency).toContain('missed right');
    expect(s.tendency).toContain('Try clubbing down');
  });

  it('falls back to the over-par narrative when nothing more pointed applies', () => {
    const input: HolePlaysInput = {
      holeNumber: 9,
      par: 4,
      plays: [play(5), play(5), play(5), play(5)], // average 5.0 → bogey range
    };
    const s = generateHoleStrategy(input)!;
    expect(s.tendency).toContain('5.0');
    expect(s.tendency).toMatch(/bogey|double/i);
  });
});

describe('buildTendency', () => {
  it('describes par-level performance', () => {
    expect(
      buildTendency({
        par: 4,
        averageOverPar: 0,
        recentParOrBetter: 2,
        recentPlays: 5,
        recentMissDirection: null,
        recentMissCount: 0,
        fairwayHitRate: null,
      }),
    ).toContain('Mostly par');
  });

  it('describes the struggle case', () => {
    const t = buildTendency({
      par: 4,
      averageOverPar: 2.0,
      recentParOrBetter: 0,
      recentPlays: 5,
      recentMissDirection: null,
      recentMissCount: 0,
      fairwayHitRate: null,
    });
    expect(t).toContain('struggle');
  });
});

describe('generateHoleStrategies', () => {
  it('orders by hole number and skips holes with fewer than 3 plays', () => {
    const out = generateHoleStrategies([
      { holeNumber: 3, par: 4, plays: [play(4), play(5), play(4)] },
      { holeNumber: 1, par: 4, plays: [play(5), play(5)] }, // not enough
      { holeNumber: 2, par: 5, plays: [play(6), play(7), play(6), play(7)] },
    ]);
    expect(out.map((s) => s.holeNumber)).toEqual([2, 3]);
  });
});
