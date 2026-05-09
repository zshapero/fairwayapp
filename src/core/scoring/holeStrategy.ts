/**
 * Pure helpers for turning a player's history at a single hole into a
 * one-line strategy "tendency". DB-free so it can be unit-tested cleanly.
 */

export type Compass4 = 'left' | 'right' | 'short' | 'long';

export interface HolePlay {
  /** Strokes taken on the hole. */
  strokes: number;
  /** True/false/null when not recorded; null is excluded from rate math. */
  fairwayHit: boolean | null;
  greenInRegulation: boolean | null;
  putts: number | null;
  /** Optional miss direction off the tee — null/undefined when not recorded. */
  fairwayMissDirection?: Compass4 | null;
  greenMissDirection?: Compass4 | null;
}

export interface HoleStrategy {
  holeNumber: number;
  par: number;
  averageScore: number;
  /** Average rounded to 1 decimal, scored relative to par. */
  averageOverPar: number;
  /** Best gross score recorded on this hole. */
  bestEverScore: number;
  /** Number of plays this strategy was computed from. */
  playsCount: number;
  /** Hit rate as 0..1; null if no fairway data was ever recorded. */
  fairwayHitRate: number | null;
  /** Hit rate as 0..1; null if no GIR data was ever recorded. */
  girHitRate: number | null;
  /** Average number of putts; null if no putts data was ever recorded. */
  averagePutts: number | null;
  /** Most frequent miss direction off the tee; null if no data. */
  commonFairwayMissDirection: Compass4 | null;
  commonGreenMissDirection: Compass4 | null;
  /** Single-line natural-language description of the player's pattern. */
  tendency: string;
}

const MIN_PLAYS = 3;
const RECENT_WINDOW = 5;

function avg(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function rateOf<T extends { fairwayHit: boolean | null }>(
  plays: T[],
): number | null {
  const present = plays.filter((p) => p.fairwayHit !== null);
  if (present.length === 0) return null;
  const hits = present.filter((p) => p.fairwayHit === true).length;
  return hits / present.length;
}

function girRate<T extends { greenInRegulation: boolean | null }>(
  plays: T[],
): number | null {
  const present = plays.filter((p) => p.greenInRegulation !== null);
  if (present.length === 0) return null;
  const hits = present.filter((p) => p.greenInRegulation === true).length;
  return hits / present.length;
}

function avgPutts<T extends { putts: number | null }>(
  plays: T[],
): number | null {
  const present = plays.filter((p): p is T & { putts: number } => p.putts !== null);
  if (present.length === 0) return null;
  return avg(present.map((p) => p.putts));
}

function modeMissDirection(
  values: (Compass4 | null | undefined)[],
): Compass4 | null {
  const counts = new Map<Compass4, number>();
  for (const v of values) {
    if (v === null || v === undefined) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best: Compass4 | null = null;
  let max = 0;
  for (const [dir, c] of counts) {
    if (c > max) {
      max = c;
      best = dir;
    }
  }
  return best;
}

interface TendencyContext {
  par: number;
  averageOverPar: number;
  recentParOrBetter: number;
  recentPlays: number;
  recentMissDirection: Compass4 | null;
  recentMissCount: number;
  fairwayHitRate: number | null;
}

function describeOverPar(par: number, averageOverPar: number): string {
  const avgScore = par + averageOverPar;
  if (averageOverPar < -0.25) {
    return `You've averaged ${avgScore.toFixed(1)} here. Often better than par.`;
  }
  if (averageOverPar < 0.25) {
    return `You've averaged ${avgScore.toFixed(1)} here. Mostly par.`;
  }
  if (averageOverPar < 0.75) {
    return `You've averaged ${avgScore.toFixed(1)} here. Hovering around bogey.`;
  }
  if (averageOverPar < 1.5) {
    return `You've averaged ${avgScore.toFixed(1)} here. Mostly bogey, occasionally double.`;
  }
  return `You've averaged ${avgScore.toFixed(1)} here. This one's been a struggle.`;
}

/** Choose the most useful sentence given the data we have. */
export function buildTendency(ctx: TendencyContext): string {
  // 1) Pattern: missed in the same direction at least 3 of the last 5 times.
  if (
    ctx.recentMissDirection !== null &&
    ctx.recentMissCount >= 3 &&
    ctx.recentPlays >= 4
  ) {
    return `You've missed ${ctx.recentMissDirection} off the tee ${ctx.recentMissCount} of your last ${ctx.recentPlays} times. Try clubbing down.`;
  }

  // 2) Pattern: par or better 3+ of the last 5 — this hole suits you.
  if (ctx.recentParOrBetter >= 3 && ctx.recentPlays >= RECENT_WINDOW - 1) {
    return `You've made par ${ctx.recentParOrBetter} of the last ${ctx.recentPlays}. This hole suits you.`;
  }

  // 3) Default: average-based summary.
  return describeOverPar(ctx.par, ctx.averageOverPar);
}

export interface HolePlaysInput {
  holeNumber: number;
  par: number;
  /** Plays in chronological order, most recent last. */
  plays: HolePlay[];
}

/**
 * Build a HoleStrategy from a player's plays at one hole. Returns null when
 * there are fewer than {@link MIN_PLAYS} plays — caller filters those out.
 */
export function generateHoleStrategy(
  input: HolePlaysInput,
): HoleStrategy | null {
  const { holeNumber, par, plays } = input;
  if (plays.length < MIN_PLAYS) return null;

  const strokes = plays.map((p) => p.strokes);
  const averageScore = avg(strokes);
  const averageOverPar = Math.round((averageScore - par) * 10) / 10;
  const bestEverScore = Math.min(...strokes);

  const fairwayHitRate = rateOf(plays);
  const girHitRate2 = girRate(plays);
  const averagePutts = avgPutts(plays);

  const commonFairwayMissDirection = modeMissDirection(
    plays.filter((p) => p.fairwayHit === false).map((p) => p.fairwayMissDirection ?? null),
  );
  const commonGreenMissDirection = modeMissDirection(
    plays.filter((p) => p.greenInRegulation === false).map((p) => p.greenMissDirection ?? null),
  );

  // Recent-window summary used by tendency selection.
  const recent = plays.slice(-RECENT_WINDOW);
  const recentParOrBetter = recent.filter((p) => p.strokes <= par).length;
  const recentMissCount = commonFairwayMissDirection === null
    ? 0
    : recent
        .filter((p) => p.fairwayHit === false && p.fairwayMissDirection === commonFairwayMissDirection)
        .length;

  const tendency = buildTendency({
    par,
    averageOverPar,
    recentParOrBetter,
    recentPlays: recent.length,
    recentMissDirection: commonFairwayMissDirection,
    recentMissCount,
    fairwayHitRate,
  });

  return {
    holeNumber,
    par,
    averageScore: Math.round(averageScore * 10) / 10,
    averageOverPar,
    bestEverScore,
    playsCount: plays.length,
    fairwayHitRate,
    girHitRate: girHitRate2,
    averagePutts: averagePutts !== null ? Math.round(averagePutts * 10) / 10 : null,
    commonFairwayMissDirection,
    commonGreenMissDirection,
    tendency,
  };
}

/** Generate strategies for every hole that has enough plays. */
export function generateHoleStrategies(
  inputs: HolePlaysInput[],
): HoleStrategy[] {
  const out: HoleStrategy[] = [];
  for (const inp of inputs.sort((a, b) => a.holeNumber - b.holeNumber)) {
    const s = generateHoleStrategy(inp);
    if (s !== null) out.push(s);
  }
  return out;
}
