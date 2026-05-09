import { describe, it, expect } from 'vitest';
import {
  bestIndexPosition,
  buildAreaPath,
  buildLinePath,
  computeYDomain,
  defaultPeriod,
  filterByPeriod,
  findClosestPoint,
  formatShortDate,
  gridValues,
  milestoneIndices,
  periodToDays,
  plotPoints,
  type SnapshotPoint,
} from '../curve';

const NOW = new Date('2026-05-09T00:00:00Z');

function snap(daysAgo: number, index: number): SnapshotPoint {
  return { date: new Date(NOW.getTime() - daysAgo * 86_400_000), index };
}

describe('periodToDays', () => {
  it('maps period chips to day windows', () => {
    expect(periodToDays('30D')).toBe(30);
    expect(periodToDays('90D')).toBe(90);
    expect(periodToDays('All')).toBeNull();
  });
});

describe('filterByPeriod', () => {
  const data = [snap(120, 20), snap(60, 18), snap(15, 16)];

  it('returns trailing window for 30D', () => {
    const out = filterByPeriod(data, '30D', NOW);
    expect(out).toHaveLength(1);
    expect(out[0].index).toBe(16);
  });

  it('returns trailing window for 90D', () => {
    const out = filterByPeriod(data, '90D', NOW);
    expect(out.map((s) => s.index)).toEqual([18, 16]);
  });

  it('returns everything for All', () => {
    expect(filterByPeriod(data, 'All', NOW)).toHaveLength(3);
  });
});

describe('defaultPeriod', () => {
  it('chooses 90D when there are 90+ days of history', () => {
    expect(defaultPeriod([snap(120, 20), snap(0, 15)], NOW)).toBe('90D');
  });
  it('chooses All when history is short', () => {
    expect(defaultPeriod([snap(10, 20), snap(0, 15)], NOW)).toBe('All');
  });
  it('returns All for empty input', () => {
    expect(defaultPeriod([], NOW)).toBe('All');
  });
});

describe('computeYDomain', () => {
  it('adds 8% breathing room above and below', () => {
    const { yMin, yMax } = computeYDomain([snap(0, 10), snap(0, 20)]);
    // Span 10 → 8% padding = 0.8.
    expect(yMin).toBeCloseTo(9.2, 5);
    expect(yMax).toBeCloseTo(20.8, 5);
  });
  it('expands a single-point dataset by ±1', () => {
    const { yMin, yMax } = computeYDomain([snap(0, 15)]);
    expect(yMax - yMin).toBeGreaterThan(2);
  });
});

describe('plotPoints + buildLinePath + buildAreaPath', () => {
  const points = [snap(60, 20), snap(30, 18), snap(0, 16)];
  const viewport = {
    width: 300,
    height: 180,
    paddingTop: 12,
    paddingBottom: 24,
    paddingLeft: 16,
    paddingRight: 16,
  };
  const yDomain = computeYDomain(points);
  const scales = {
    yMin: yDomain.yMin,
    yMax: yDomain.yMax,
    domainMin: points[0].date,
    domainMax: points[2].date,
  };

  it('places first point at left edge and last point at right edge', () => {
    const plotted = plotPoints(points, viewport, scales);
    expect(plotted[0].x).toBeCloseTo(viewport.paddingLeft, 5);
    expect(plotted[2].x).toBeCloseTo(viewport.width - viewport.paddingRight, 5);
  });

  it('inverts y so lower handicap renders higher on screen', () => {
    const plotted = plotPoints(points, viewport, scales);
    // Index 16 (best) should be higher (smaller y) than index 20 (worst).
    expect(plotted[2].y).toBeLessThan(plotted[0].y);
  });

  it('produces non-empty d strings for line and area', () => {
    const plotted = plotPoints(points, viewport, scales);
    expect(buildLinePath(plotted)).toMatch(/^M/);
    expect(buildAreaPath(plotted, viewport.height - viewport.paddingBottom)).toMatch(/^M/);
  });

  it('returns empty string when no points are provided', () => {
    expect(buildLinePath([])).toBe('');
    expect(buildAreaPath([], 100)).toBe('');
  });
});

describe('gridValues', () => {
  it('returns 3 evenly-spaced values inside the y-domain', () => {
    const vs = gridValues(10, 20);
    expect(vs).toHaveLength(3);
    expect(vs[0]).toBeLessThan(vs[1]);
    expect(vs[1]).toBeLessThan(vs[2]);
  });
});

describe('findClosestPoint', () => {
  it('picks the point whose x is closest', () => {
    const pts = [
      { x: 0, y: 0, date: new Date(), index: 10 },
      { x: 50, y: 0, date: new Date(), index: 11 },
      { x: 100, y: 0, date: new Date(), index: 12 },
    ];
    expect(findClosestPoint(pts, 60)?.index).toBe(11);
    expect(findClosestPoint(pts, 95)?.index).toBe(12);
    expect(findClosestPoint([], 50)).toBeNull();
  });
});

describe('formatShortDate', () => {
  it('formats as "Mon DD"', () => {
    expect(formatShortDate(new Date('2026-04-12T12:00:00Z'))).toMatch(/Apr 1[12]/);
  });
});

describe('path generation at acceptance sizes', () => {
  const viewport = {
    width: 320,
    height: 180,
    paddingTop: 16,
    paddingBottom: 28,
    paddingLeft: 16,
    paddingRight: 18,
  };

  function runFor(n: number): void {
    const data: SnapshotPoint[] = Array.from({ length: n }, (_, i) =>
      snap(n - 1 - i, 18 - i * 0.1),
    );
    const yDomain = computeYDomain(data);
    const scales = {
      yMin: yDomain.yMin,
      yMax: yDomain.yMax,
      domainMin: data[0].date,
      domainMax: data[n - 1].date,
    };
    const points = plotPoints(data, viewport, scales);
    const line = buildLinePath(points);
    const area = buildAreaPath(points, viewport.height - viewport.paddingBottom);
    expect(points).toHaveLength(n);
    expect(line.length).toBeGreaterThan(0);
    expect(area.length).toBeGreaterThan(line.length);
  }

  it('produces a non-empty line and area for 3 snapshots', () => runFor(3));
  it('produces a non-empty line and area for 10 snapshots', () => runFor(10));
  it('produces a non-empty line and area for 30 snapshots', () => runFor(30));
});

describe('annotations', () => {
  it('finds the lowest-index snapshot', () => {
    const data = [snap(60, 20), snap(30, 14), snap(0, 16)];
    expect(bestIndexPosition(data)).toBe(1);
    expect(bestIndexPosition([])).toBeNull();
  });

  it('detects integer-floor milestones in chronological order', () => {
    const data = [snap(40, 18.5), snap(30, 17.9), snap(20, 17.4), snap(10, 16.8)];
    // 18.x → 17.x at index 1, 17.x → 16.x at index 3.
    expect(milestoneIndices(data)).toEqual([1, 3]);
  });

  it('returns no milestones when index never crosses an integer floor', () => {
    const data = [snap(30, 18.5), snap(20, 18.2), snap(10, 18.0)];
    expect(milestoneIndices(data)).toEqual([]);
  });
});
