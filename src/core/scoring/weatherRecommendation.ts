export interface WeatherRoundSummary {
  /** Gross strokes for the round (use AGS if you have it). */
  grossScore: number;
  /** Wind speed in mph for the round, null if unknown. */
  windSpeedMph: number | null;
}

export interface WeatherAwareTrigger {
  triggered: boolean;
  /** Average score in mild conditions (< 10 mph). */
  mildAverage: number | null;
  /** Average score in windy conditions (> 15 mph). */
  windyAverage: number | null;
  /** windyAverage - mildAverage (positive = wind hurts more than mild). */
  delta: number | null;
}

const MILD_MAX = 10;
const WINDY_MIN = 15;
const MIN_BUCKET_SIZE = 4;
const TRIGGER_THRESHOLD = 4;

/**
 * Looks at the player's last {@link lookback} rounds and decides whether
 * the wind has been a problem. Mirrors recommendation rule #17 from the
 * spec: gap of more than 4 strokes between mild and windy averages, with
 * at least 4 rounds in each bucket.
 *
 * Pure: takes summaries, returns a verdict.  No DB calls.
 */
export function detectWeatherAwarePerformance(
  rounds: WeatherRoundSummary[],
  lookback = 10,
): WeatherAwareTrigger {
  const recent = rounds.slice(-lookback);
  const mild: number[] = [];
  const windy: number[] = [];
  for (const r of recent) {
    if (r.windSpeedMph === null) continue;
    if (r.windSpeedMph < MILD_MAX) mild.push(r.grossScore);
    else if (r.windSpeedMph > WINDY_MIN) windy.push(r.grossScore);
  }
  if (mild.length < MIN_BUCKET_SIZE || windy.length < MIN_BUCKET_SIZE) {
    return {
      triggered: false,
      mildAverage: mild.length > 0 ? avg(mild) : null,
      windyAverage: windy.length > 0 ? avg(windy) : null,
      delta: null,
    };
  }
  const mildAverage = avg(mild);
  const windyAverage = avg(windy);
  const delta = windyAverage - mildAverage;
  return {
    triggered: delta > TRIGGER_THRESHOLD,
    mildAverage,
    windyAverage,
    delta,
  };
}

function avg(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}
