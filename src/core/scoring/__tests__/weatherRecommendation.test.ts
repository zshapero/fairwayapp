import { describe, expect, it } from 'vitest';
import {
  detectWeatherAwarePerformance,
  type WeatherRoundSummary,
} from '../weatherRecommendation';

function r(grossScore: number, windSpeedMph: number | null): WeatherRoundSummary {
  return { grossScore, windSpeedMph };
}

describe('detectWeatherAwarePerformance', () => {
  it('does not trigger without 4 rounds in each bucket', () => {
    const v = detectWeatherAwarePerformance([
      r(85, 5),
      r(86, 6),
      r(87, 7),
      r(95, 18),
      r(96, 20),
    ]);
    expect(v.triggered).toBe(false);
  });

  it('triggers when the windy average is more than 4 strokes worse than the mild average', () => {
    const v = detectWeatherAwarePerformance([
      r(82, 4),
      r(84, 5),
      r(85, 6),
      r(86, 7),
      r(94, 18),
      r(96, 20),
      r(97, 22),
      r(99, 25),
    ]);
    expect(v.triggered).toBe(true);
    expect(v.mildAverage).toBeCloseTo(84.25, 2);
    expect(v.windyAverage).toBeCloseTo(96.5, 2);
    expect((v.delta ?? 0) > 4).toBe(true);
  });

  it('does not trigger when the gap is small', () => {
    const v = detectWeatherAwarePerformance([
      r(85, 4),
      r(86, 5),
      r(87, 6),
      r(88, 7),
      r(86, 18),
      r(87, 20),
      r(88, 22),
      r(89, 25),
    ]);
    expect(v.triggered).toBe(false);
  });

  it('ignores rounds without wind data', () => {
    const v = detectWeatherAwarePerformance([
      r(82, null),
      r(84, null),
      r(85, null),
      r(86, null),
      r(94, null),
      r(96, null),
      r(97, null),
      r(99, null),
    ]);
    expect(v.triggered).toBe(false);
    expect(v.mildAverage).toBeNull();
    expect(v.windyAverage).toBeNull();
  });

  it('respects the lookback window', () => {
    const longHistory: WeatherRoundSummary[] = [
      // 10 ancient rounds where wind hurt:
      ...Array.from({ length: 5 }, () => r(82, 5)),
      ...Array.from({ length: 5 }, () => r(96, 22)),
      // The most recent 4 only — all mild — should sink the trigger.
      r(85, 5),
      r(85, 5),
      r(85, 5),
      r(85, 5),
    ];
    const v = detectWeatherAwarePerformance(longHistory, 4);
    expect(v.triggered).toBe(false);
  });
});
