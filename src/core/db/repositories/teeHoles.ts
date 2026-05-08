import type { Db } from '../db';
import type { TeeHole } from '../types';

export interface TeeHoleInput {
  tee_id: number;
  hole_number: number;
  par: number;
  yardage?: number | null;
  stroke_index: number;
}

const SELECT =
  'SELECT id, tee_id, hole_number, par, yardage, stroke_index FROM tee_holes';

export function createTeeHole(db: Db, input: TeeHoleInput): TeeHole {
  const r = db.runSync(
    `INSERT INTO tee_holes (tee_id, hole_number, par, yardage, stroke_index)
     VALUES (?, ?, ?, ?, ?)`,
    [input.tee_id, input.hole_number, input.par, input.yardage ?? null, input.stroke_index],
  );
  return getTeeHole(db, r.lastInsertRowId)!;
}

export function bulkCreateTeeHoles(db: Db, inputs: TeeHoleInput[]): void {
  for (const input of inputs) createTeeHole(db, input);
}

export function getTeeHole(db: Db, id: number): TeeHole | null {
  return db.getFirstSync<TeeHole>(`${SELECT} WHERE id = ?`, [id]);
}

export function listTeeHoles(db: Db, teeId: number): TeeHole[] {
  return db.getAllSync<TeeHole>(
    `${SELECT} WHERE tee_id = ? ORDER BY hole_number`,
    [teeId],
  );
}

export function countTeeHoles(db: Db): number {
  const r = db.getFirstSync<{ c: number }>('SELECT COUNT(*) AS c FROM tee_holes', []);
  return r?.c ?? 0;
}
