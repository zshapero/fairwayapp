import {
  addDays,
  endOfMonth,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

export interface CalendarCell {
  date: Date;
  /** True when the cell falls inside the visible month. */
  inMonth: boolean;
}

/**
 * Build a 6×7 grid for the month containing {@link cursor}, week-aligned to
 * Sunday. Always returns 42 cells so the calendar grid keeps consistent
 * height regardless of where the month starts or ends.
 */
export function buildMonthGrid(cursor: Date): CalendarCell[] {
  const monthStart = startOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const date = addDays(gridStart, i);
    cells.push({ date, inMonth: isSameMonth(date, cursor) });
  }
  return cells;
}

/** Last calendar day in the visible grid (used to bound DB queries). */
export function gridDateRange(cursor: Date): { from: Date; to: Date } {
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = addDays(gridStart, 42); // exclusive end
  return { from: gridStart, to: gridEnd > monthEnd ? gridEnd : monthEnd };
}

/** Count rounds keyed by YYYY-MM-DD for fast cell lookup. */
export function countRoundsByDay(
  rounds: { played_at: string }[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of rounds) {
    const d = new Date(r.played_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(d.getDate()).padStart(2, '0')}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`;
}
