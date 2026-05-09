import type { SnapshotPoint } from '../HandicapTrendChart';

/**
 * Synthetic snapshots used as a demo seed for the home screen until real
 * round entry exists. Designed to show the chart in its richest state:
 * roughly four months of weekly snapshots trending from 18.6 to 14.2 with
 * realistic week-to-week noise and a clear best-ever low point.
 */
export function generateDemoTrend(now: Date = new Date()): SnapshotPoint[] {
  // Hand-picked indices — gentle improvement, two notable dips.
  const series = [
    18.6, 18.4, 18.5, 18.1, 17.7, 17.9, 17.4, 17.0, 17.2, 16.8, 16.6, 16.9,
    16.4, 16.0, 15.7, 15.9, 15.5, 15.0, 14.6, 14.2, 14.5, 14.3, 14.0, 14.2,
    13.8, 14.0, 14.4, 14.2,
  ];
  const snapshots: SnapshotPoint[] = [];
  for (let i = 0; i < series.length; i++) {
    const daysAgo = (series.length - 1 - i) * 6; // ~weekly cadence
    snapshots.push({
      date: new Date(now.getTime() - daysAgo * 86_400_000),
      index: series[i],
    });
  }
  return snapshots;
}
