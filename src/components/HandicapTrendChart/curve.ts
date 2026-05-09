import { line as d3Line, curveCatmullRom, area as d3Area } from 'd3-shape';

export interface SnapshotPoint {
  date: Date;
  index: number;
}

export interface ChartViewport {
  width: number;
  height: number;
  paddingTop: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
}

export interface PlottedPoint {
  x: number;
  y: number;
  date: Date;
  index: number;
}

export interface ChartScales {
  yMin: number;
  yMax: number;
  domainMin: Date;
  domainMax: Date;
}

export type Period = '30D' | '90D' | 'All';

/** Period chip → number of trailing days, or null for 'All'. */
export function periodToDays(period: Period): number | null {
  if (period === '30D') return 30;
  if (period === '90D') return 90;
  return null;
}

/** Filter snapshots to a trailing window. */
export function filterByPeriod(
  snapshots: SnapshotPoint[],
  period: Period,
  now: Date = new Date(),
): SnapshotPoint[] {
  const days = periodToDays(period);
  if (days === null) return snapshots;
  const cutoff = now.getTime() - days * 86_400_000;
  return snapshots.filter((s) => s.date.getTime() >= cutoff);
}

/** Choose a sensible default period based on data span. */
export function defaultPeriod(snapshots: SnapshotPoint[], now: Date = new Date()): Period {
  if (snapshots.length === 0) return 'All';
  const first = snapshots[0].date.getTime();
  const spanDays = (now.getTime() - first) / 86_400_000;
  return spanDays >= 90 ? '90D' : 'All';
}

/**
 * Compute the y-axis domain with 8% breathing room above and below the
 * data extents. For a single-point dataset, expand by ±1 stroke so the
 * line has somewhere to live.
 */
export function computeYDomain(snapshots: SnapshotPoint[]): { yMin: number; yMax: number } {
  if (snapshots.length === 0) return { yMin: 0, yMax: 1 };
  const indices = snapshots.map((s) => s.index);
  let lo = Math.min(...indices);
  let hi = Math.max(...indices);
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  const span = hi - lo;
  return { yMin: lo - span * 0.08, yMax: hi + span * 0.08 };
}

/** Project snapshots onto the SVG viewport. */
export function plotPoints(
  snapshots: SnapshotPoint[],
  viewport: ChartViewport,
  scales: ChartScales,
): PlottedPoint[] {
  const innerW = viewport.width - viewport.paddingLeft - viewport.paddingRight;
  const innerH = viewport.height - viewport.paddingTop - viewport.paddingBottom;
  const xMin = scales.domainMin.getTime();
  const xMax = scales.domainMax.getTime();
  const xSpan = xMax - xMin || 1;
  const ySpan = scales.yMax - scales.yMin || 1;
  return snapshots.map((s) => {
    const xRatio = (s.date.getTime() - xMin) / xSpan;
    const yRatio = (s.index - scales.yMin) / ySpan;
    return {
      x: viewport.paddingLeft + xRatio * innerW,
      // Lower handicap = better. We deliberately do NOT invert SVG y here so
      // a *lower* index value renders *higher* on the chart, making "trending
      // up" mean "getting better" — the orientation golfers expect.
      y: viewport.paddingTop + yRatio * innerH,
      date: s.date,
      index: s.index,
    };
  });
}

/** Smooth Catmull-Rom curve through the plotted points. */
export function buildLinePath(points: PlottedPoint[]): string {
  if (points.length === 0) return '';
  const generator = d3Line<PlottedPoint>()
    .x((p) => p.x)
    .y((p) => p.y)
    .curve(curveCatmullRom.alpha(0.5));
  return generator(points) ?? '';
}

/** Closed area path for the gradient fill (line on top, baseline at the bottom). */
export function buildAreaPath(points: PlottedPoint[], baselineY: number): string {
  if (points.length === 0) return '';
  const generator = d3Area<PlottedPoint>()
    .x((p) => p.x)
    .y0(() => baselineY)
    .y1((p) => p.y)
    .curve(curveCatmullRom.alpha(0.5));
  return generator(points) ?? '';
}

/** 3 evenly spaced y-axis grid values inside the y-domain. */
export function gridValues(yMin: number, yMax: number): number[] {
  return [
    yMin + (yMax - yMin) * 0.2,
    yMin + (yMax - yMin) * 0.5,
    yMin + (yMax - yMin) * 0.8,
  ];
}

export function findClosestPoint(points: PlottedPoint[], x: number): PlottedPoint | null {
  if (points.length === 0) return null;
  let best = points[0];
  let bestDist = Math.abs(points[0].x - x);
  for (let i = 1; i < points.length; i++) {
    const d = Math.abs(points[i].x - x);
    if (d < bestDist) {
      best = points[i];
      bestDist = d;
    }
  }
  return best;
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** "Apr 12" — short, pointed month + day. */
export function formatShortDate(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
}

/** Index of the snapshot with the lowest (best) handicap, or null. */
export function bestIndexPosition(snapshots: SnapshotPoint[]): number | null {
  if (snapshots.length === 0) return null;
  let best = 0;
  for (let i = 1; i < snapshots.length; i++) {
    if (snapshots[i].index < snapshots[best].index) best = i;
  }
  return best;
}

/**
 * Detect a milestone where the index dropped to a new integer floor —
 * e.g., crossing from 18.x to 17.x.  Returns the index of the first
 * snapshot in each new floor (excluding the very first snapshot).
 */
export function milestoneIndices(snapshots: SnapshotPoint[]): number[] {
  if (snapshots.length < 2) return [];
  const result: number[] = [];
  let bestSeen = Math.floor(snapshots[0].index);
  for (let i = 1; i < snapshots.length; i++) {
    const floor = Math.floor(snapshots[i].index);
    if (floor < bestSeen) {
      result.push(i);
      bestSeen = floor;
    }
  }
  return result;
}
