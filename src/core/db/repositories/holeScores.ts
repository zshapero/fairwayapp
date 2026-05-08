import type { Db } from '../db';
import type { HoleScore, IntBool } from '../types';

export interface HoleScoreInput {
  round_id: number;
  hole_number: number;
  par: number;
  strokes: number;
  putts?: number | null;
  fairway_hit?: IntBool | null;
  green_in_regulation?: IntBool | null;
  penalty_strokes?: number | null;
  sand_save?: IntBool | null;
}

const SELECT =
  `SELECT id, round_id, hole_number, par, strokes, putts, fairway_hit,
          green_in_regulation, penalty_strokes, sand_save FROM hole_scores`;

export function createHoleScore(db: Db, input: HoleScoreInput): HoleScore {
  const r = db.runSync(
    `INSERT INTO hole_scores
       (round_id, hole_number, par, strokes, putts, fairway_hit,
        green_in_regulation, penalty_strokes, sand_save)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.round_id,
      input.hole_number,
      input.par,
      input.strokes,
      input.putts ?? null,
      input.fairway_hit ?? null,
      input.green_in_regulation ?? null,
      input.penalty_strokes ?? null,
      input.sand_save ?? null,
    ],
  );
  return db.getFirstSync<HoleScore>(`${SELECT} WHERE id = ?`, [r.lastInsertRowId])!;
}

export function listHoleScoresForRound(db: Db, roundId: number): HoleScore[] {
  return db.getAllSync<HoleScore>(
    `${SELECT} WHERE round_id = ? ORDER BY hole_number`,
    [roundId],
  );
}

export function deleteHoleScoresForRound(db: Db, roundId: number): void {
  db.runSync('DELETE FROM hole_scores WHERE round_id = ?', [roundId]);
}

export function countHoleScores(db: Db): number {
  const r = db.getFirstSync<{ c: number }>('SELECT COUNT(*) AS c FROM hole_scores', []);
  return r?.c ?? 0;
}
