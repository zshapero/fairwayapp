import type { Db } from '../db';
import type { HandicapSnapshot } from '../types';

export interface HandicapSnapshotInput {
  player_id: number;
  handicap_index: number;
  rounds_used_count: number;
  triggering_round_id?: number | null;
}

const SELECT =
  `SELECT id, player_id, calculated_at, handicap_index, rounds_used_count, triggering_round_id
     FROM handicap_snapshots`;

export function createHandicapSnapshot(
  db: Db,
  input: HandicapSnapshotInput,
): HandicapSnapshot {
  const r = db.runSync(
    `INSERT INTO handicap_snapshots
       (player_id, calculated_at, handicap_index, rounds_used_count, triggering_round_id)
     VALUES (?, ?, ?, ?, ?)`,
    [
      input.player_id,
      new Date().toISOString(),
      input.handicap_index,
      input.rounds_used_count,
      input.triggering_round_id ?? null,
    ],
  );
  return db.getFirstSync<HandicapSnapshot>(`${SELECT} WHERE id = ?`, [r.lastInsertRowId])!;
}

export function getLatestSnapshot(db: Db, playerId: number): HandicapSnapshot | null {
  return db.getFirstSync<HandicapSnapshot>(
    `${SELECT} WHERE player_id = ? ORDER BY calculated_at DESC, id DESC LIMIT 1`,
    [playerId],
  );
}

export function listSnapshotsForPlayer(db: Db, playerId: number): HandicapSnapshot[] {
  return db.getAllSync<HandicapSnapshot>(
    `${SELECT} WHERE player_id = ? ORDER BY calculated_at DESC, id DESC`,
    [playerId],
  );
}

export function countHandicapSnapshots(db: Db): number {
  const r = db.getFirstSync<{ c: number }>(
    'SELECT COUNT(*) AS c FROM handicap_snapshots',
    [],
  );
  return r?.c ?? 0;
}
