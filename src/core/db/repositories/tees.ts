import type { Db } from '../db';
import type { Tee } from '../types';

export interface TeeInput {
  course_id: number;
  tee_name: string;
  gender?: string | null;
  course_rating: number;
  slope_rating: number;
  total_yards?: number | null;
  par_total?: number | null;
}

const SELECT =
  'SELECT id, course_id, tee_name, gender, course_rating, slope_rating, total_yards, par_total FROM tees';

export function createTee(db: Db, input: TeeInput): Tee {
  const r = db.runSync(
    `INSERT INTO tees
       (course_id, tee_name, gender, course_rating, slope_rating, total_yards, par_total)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.course_id,
      input.tee_name,
      input.gender ?? null,
      input.course_rating,
      input.slope_rating,
      input.total_yards ?? null,
      input.par_total ?? null,
    ],
  );
  return getTee(db, r.lastInsertRowId)!;
}

export function getTee(db: Db, id: number): Tee | null {
  return db.getFirstSync<Tee>(`${SELECT} WHERE id = ?`, [id]);
}

export function listTeesForCourse(db: Db, courseId: number): Tee[] {
  return db.getAllSync<Tee>(`${SELECT} WHERE course_id = ? ORDER BY id`, [courseId]);
}

export function deleteTee(db: Db, id: number): void {
  db.runSync('DELETE FROM tees WHERE id = ?', [id]);
}

export function countTees(db: Db): number {
  const r = db.getFirstSync<{ c: number }>('SELECT COUNT(*) AS c FROM tees', []);
  return r?.c ?? 0;
}
