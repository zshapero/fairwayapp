import { describe, expect, it } from 'vitest';
import { buildMonthGrid, countRoundsByDay, dayKey } from '../grid';

describe('buildMonthGrid', () => {
  it('returns exactly 42 cells, week-aligned to Sunday', () => {
    const grid = buildMonthGrid(new Date(2026, 3, 1)); // Apr 2026 — Wed
    expect(grid).toHaveLength(42);
    // First cell should be a Sunday on or before April 1.
    expect(grid[0].date.getDay()).toBe(0);
    expect(grid[0].date <= new Date(2026, 3, 1)).toBe(true);
  });

  it('flags inMonth correctly for boundary cells', () => {
    const grid = buildMonthGrid(new Date(2026, 3, 1));
    expect(grid[0].inMonth).toBe(false); // Sunday in March
    const apr1Index = grid.findIndex(
      (c) => c.date.getMonth() === 3 && c.date.getDate() === 1,
    );
    expect(grid[apr1Index].inMonth).toBe(true);
  });
});

describe('countRoundsByDay + dayKey', () => {
  it('keys by local date', () => {
    const counts = countRoundsByDay([
      { played_at: '2026-04-12T15:00:00Z' },
      { played_at: '2026-04-12T20:00:00Z' },
      { played_at: '2026-04-13T15:00:00Z' },
    ]);
    const k = dayKey(new Date(2026, 3, 12));
    expect(counts.get(k)).toBe(2);
    expect(counts.get(dayKey(new Date(2026, 3, 13)))).toBe(1);
  });
});
