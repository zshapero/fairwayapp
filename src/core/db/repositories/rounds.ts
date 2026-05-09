import type { Db } from '../db';
import type { Round } from '../types';

export interface RoundInputRow {
  player_id: number;
  course_id: number;
  tee_id: number;
  played_at: string;
  num_holes_played: number;
  pcc: number;
  course_handicap: number;
  adjusted_gross_score?: number | null;
  score_differential?: number | null;
  notes?: string | null;
}

const SELECT =
  `SELECT id, player_id, course_id, tee_id, played_at, num_holes_played, pcc,
          course_handicap, adjusted_gross_score, score_differential, notes, created_at,
          temperature_f, wind_speed_mph, wind_direction, precipitation_mm,
          weather_condition, weather_fetched_at
     FROM rounds`;

export function createRound(db: Db, input: RoundInputRow): Round {
  const r = db.runSync(
    `INSERT INTO rounds
       (player_id, course_id, tee_id, played_at, num_holes_played, pcc,
        course_handicap, adjusted_gross_score, score_differential, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.player_id,
      input.course_id,
      input.tee_id,
      input.played_at,
      input.num_holes_played,
      input.pcc,
      input.course_handicap,
      input.adjusted_gross_score ?? null,
      input.score_differential ?? null,
      input.notes ?? null,
      new Date().toISOString(),
    ],
  );
  return getRound(db, r.lastInsertRowId)!;
}

export function getRound(db: Db, id: number): Round | null {
  return db.getFirstSync<Round>(`${SELECT} WHERE id = ?`, [id]);
}

export function listRoundsForPlayer(db: Db, playerId: number): Round[] {
  return db.getAllSync<Round>(
    `${SELECT} WHERE player_id = ? ORDER BY played_at DESC`,
    [playerId],
  );
}

export function updateRoundResults(
  db: Db,
  id: number,
  results: { adjusted_gross_score: number; score_differential: number },
): Round | null {
  db.runSync(
    'UPDATE rounds SET adjusted_gross_score = ?, score_differential = ? WHERE id = ?',
    [results.adjusted_gross_score, results.score_differential, id],
  );
  return getRound(db, id);
}

export interface RoundPatch {
  notes?: string | null;
  played_at?: string;
  num_holes_played?: number;
  pcc?: number;
  course_handicap?: number;
  adjusted_gross_score?: number | null;
  score_differential?: number | null;
}

/**
 * Apply a partial update to a round. Only the fields present in {@link patch}
 * are written; the rest are preserved.
 */
export function updateRound(db: Db, id: number, patch: RoundPatch): Round | null {
  const existing = getRound(db, id);
  if (existing === null) return null;
  const next = { ...existing, ...patch };
  db.runSync(
    `UPDATE rounds SET
       notes = ?,
       played_at = ?,
       num_holes_played = ?,
       pcc = ?,
       course_handicap = ?,
       adjusted_gross_score = ?,
       score_differential = ?
     WHERE id = ?`,
    [
      next.notes ?? null,
      next.played_at,
      next.num_holes_played,
      next.pcc,
      next.course_handicap,
      next.adjusted_gross_score ?? null,
      next.score_differential ?? null,
      id,
    ],
  );
  return getRound(db, id);
}

export function deleteRound(db: Db, id: number): void {
  db.runSync('DELETE FROM rounds WHERE id = ?', [id]);
}

export interface WeatherUpdate {
  temperature_f: number | null;
  wind_speed_mph: number | null;
  wind_direction: string | null;
  precipitation_mm: number | null;
  weather_condition: string | null;
}

/**
 * Persist a weather observation onto a round and stamp weather_fetched_at
 * (epoch ms) so backfill can skip it next time.
 */
export function setRoundWeather(
  db: Db,
  id: number,
  patch: WeatherUpdate,
): Round | null {
  db.runSync(
    `UPDATE rounds SET
       temperature_f = ?,
       wind_speed_mph = ?,
       wind_direction = ?,
       precipitation_mm = ?,
       weather_condition = ?,
       weather_fetched_at = ?
     WHERE id = ?`,
    [
      patch.temperature_f,
      patch.wind_speed_mph,
      patch.wind_direction,
      patch.precipitation_mm,
      patch.weather_condition,
      Date.now(),
      id,
    ],
  );
  return getRound(db, id);
}

/** Mark a round as having tried-and-failed weather fetch so we don't loop. */
export function markRoundWeatherUnavailable(db: Db, id: number): void {
  db.runSync(
    'UPDATE rounds SET weather_fetched_at = ? WHERE id = ?',
    [Date.now(), id],
  );
}

/** Rounds whose weather hasn't been fetched yet (regardless of player). */
export function listRoundsNeedingWeather(db: Db, limit = 50): Round[] {
  return db.getAllSync<Round>(
    `${SELECT} WHERE weather_fetched_at IS NULL ORDER BY played_at DESC LIMIT ?`,
    [limit],
  );
}

export function countRounds(db: Db): number {
  const r = db.getFirstSync<{ c: number }>('SELECT COUNT(*) AS c FROM rounds', []);
  return r?.c ?? 0;
}

/** Rounds for a player whose played_at falls in the half-open [from, to) range. */
export function getRoundsForPlayerInDateRange(
  db: Db,
  playerId: number,
  fromTimestamp: number,
  toTimestamp: number,
): Round[] {
  return db.getAllSync<Round>(
    `${SELECT} WHERE player_id = ? AND played_at >= ? AND played_at < ?
       ORDER BY played_at ASC`,
    [playerId, new Date(fromTimestamp).toISOString(), new Date(toTimestamp).toISOString()],
  );
}

/** Rounds for a player at a specific course, most recent first. */
export function listRoundsAtCourseForPlayer(
  db: Db,
  playerId: number,
  courseId: number,
): Round[] {
  return db.getAllSync<Round>(
    `${SELECT} WHERE player_id = ? AND course_id = ? ORDER BY played_at DESC`,
    [playerId, courseId],
  );
}

export interface MonthGroup {
  /** "YYYY-MM" key. */
  yearMonth: string;
  rounds: Round[];
}

/**
 * Rounds for a player grouped by year-month, ordered most-recent month first.
 * Limits the lookback to {@link monthsBack} months from today.
 */
export function getRoundsForPlayerGroupedByMonth(
  db: Db,
  playerId: number,
  monthsBack = 12,
): MonthGroup[] {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - monthsBack);
  const rows = db.getAllSync<Round>(
    `${SELECT} WHERE player_id = ? AND played_at >= ? ORDER BY played_at DESC`,
    [playerId, cutoff.toISOString()],
  );
  const groups = new Map<string, Round[]>();
  for (const r of rows) {
    const d = new Date(r.played_at);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const list = groups.get(ym) ?? [];
    list.push(r);
    groups.set(ym, list);
  }
  return Array.from(groups.entries()).map(([yearMonth, rs]) => ({
    yearMonth,
    rounds: rs,
  }));
}
