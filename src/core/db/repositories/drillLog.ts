import type { Db } from '../db';

export interface DrillLogEntry {
  id: number;
  player_id: number;
  recommendation_key: string;
  logged_at: string;
  notes: string | null;
}

export interface DrillLogInput {
  player_id: number;
  recommendation_key: string;
  notes?: string | null;
}

const SELECT =
  'SELECT id, player_id, recommendation_key, logged_at, notes FROM drill_log';

export function logDrill(db: Db, input: DrillLogInput): DrillLogEntry {
  const r = db.runSync(
    'INSERT INTO drill_log (player_id, recommendation_key, logged_at, notes) VALUES (?, ?, ?, ?)',
    [
      input.player_id,
      input.recommendation_key,
      new Date().toISOString(),
      input.notes ?? null,
    ],
  );
  return db.getFirstSync<DrillLogEntry>(`${SELECT} WHERE id = ?`, [r.lastInsertRowId])!;
}

export function listDrillLog(db: Db, playerId: number): DrillLogEntry[] {
  return db.getAllSync<DrillLogEntry>(
    `${SELECT} WHERE player_id = ? ORDER BY logged_at DESC, id DESC`,
    [playerId],
  );
}

export function countDrillLog(db: Db): number {
  const r = db.getFirstSync<{ c: number }>('SELECT COUNT(*) AS c FROM drill_log', []);
  return r?.c ?? 0;
}

/**
 * Whether a given recommendation has been logged within the trailing
 * window. Used by the recommendations screen to flip a "Practiced today"
 * button into its "logged" state.
 */
export function hasLoggedRecently(
  db: Db,
  playerId: number,
  recommendationKey: string,
  withinHours = 24,
): boolean {
  const cutoff = new Date(Date.now() - withinHours * 3_600_000).toISOString();
  const row = db.getFirstSync<{ c: number }>(
    `SELECT COUNT(*) AS c FROM drill_log
       WHERE player_id = ? AND recommendation_key = ? AND logged_at >= ?`,
    [playerId, recommendationKey, cutoff],
  );
  return (row?.c ?? 0) > 0;
}
