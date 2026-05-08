import type { Db } from '../db';
import type { Course, IntBool } from '../types';

export interface CourseInput {
  external_id?: string | null;
  club_name: string;
  course_name?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  num_holes: number;
  is_favorite?: IntBool;
}

const SELECT =
  'SELECT id, external_id, club_name, course_name, city, state, country, num_holes, is_favorite, created_at FROM courses';

export function createCourse(db: Db, input: CourseInput): Course {
  const r = db.runSync(
    `INSERT INTO courses
       (external_id, club_name, course_name, city, state, country, num_holes, is_favorite, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.external_id ?? null,
      input.club_name,
      input.course_name ?? null,
      input.city ?? null,
      input.state ?? null,
      input.country ?? null,
      input.num_holes,
      input.is_favorite ?? 0,
      new Date().toISOString(),
    ],
  );
  return getCourse(db, r.lastInsertRowId)!;
}

export function getCourse(db: Db, id: number): Course | null {
  return db.getFirstSync<Course>(`${SELECT} WHERE id = ?`, [id]);
}

export function listCourses(db: Db): Course[] {
  return db.getAllSync<Course>(`${SELECT} ORDER BY club_name, course_name`, []);
}

export function setFavorite(db: Db, id: number, isFavorite: IntBool): void {
  db.runSync('UPDATE courses SET is_favorite = ? WHERE id = ?', [isFavorite, id]);
}

export function deleteCourse(db: Db, id: number): void {
  db.runSync('DELETE FROM courses WHERE id = ?', [id]);
}

export function countCourses(db: Db): number {
  const r = db.getFirstSync<{ c: number }>('SELECT COUNT(*) AS c FROM courses', []);
  return r?.c ?? 0;
}
