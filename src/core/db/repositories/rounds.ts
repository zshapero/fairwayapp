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
          course_handicap, adjusted_gross_score, score_differential, notes, created_at
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

export function deleteRound(db: Db, id: number): void {
  db.runSync('DELETE FROM rounds WHERE id = ?', [id]);
}

export function countRounds(db: Db): number {
  const r = db.getFirstSync<{ c: number }>('SELECT COUNT(*) AS c FROM rounds', []);
  return r?.c ?? 0;
}
