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
  latitude?: number | null;
  longitude?: number | null;
}

const SELECT =
  'SELECT id, external_id, club_name, course_name, city, state, country, num_holes, is_favorite, created_at, latitude, longitude FROM courses';

export function createCourse(db: Db, input: CourseInput): Course {
  const r = db.runSync(
    `INSERT INTO courses
       (external_id, club_name, course_name, city, state, country, num_holes,
        is_favorite, created_at, latitude, longitude)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      input.latitude ?? null,
      input.longitude ?? null,
    ],
  );
  return getCourse(db, r.lastInsertRowId)!;
}

/** Update lat/lng on a course (used after geocoding an imported record). */
export function setCourseCoordinates(
  db: Db,
  id: number,
  latitude: number,
  longitude: number,
): void {
  db.runSync('UPDATE courses SET latitude = ?, longitude = ? WHERE id = ?', [
    latitude,
    longitude,
    id,
  ]);
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

export interface CourseStats {
  roundsCount: number;
  bestScore: number | null;
  bestDifferential: number | null;
  averageScore: number | null;
  averageDifferential: number | null;
  mostPlayedTeeId: number | null;
  lastPlayedAt: string | null;
}

export function getCourseStats(
  db: Db,
  courseId: number,
  playerId: number,
): CourseStats {
  const row = db.getFirstSync<{
    rc: number;
    best_score: number | null;
    best_diff: number | null;
    avg_score: number | null;
    avg_diff: number | null;
    last_played: string | null;
  }>(
    `SELECT
       COUNT(*) AS rc,
       MIN(adjusted_gross_score) AS best_score,
       MIN(score_differential) AS best_diff,
       AVG(adjusted_gross_score) AS avg_score,
       AVG(score_differential) AS avg_diff,
       MAX(played_at) AS last_played
     FROM rounds
     WHERE course_id = ? AND player_id = ?`,
    [courseId, playerId],
  );
  const teeRow = db.getFirstSync<{ tee_id: number; cnt: number }>(
    `SELECT tee_id, COUNT(*) AS cnt
       FROM rounds WHERE course_id = ? AND player_id = ?
       GROUP BY tee_id ORDER BY cnt DESC LIMIT 1`,
    [courseId, playerId],
  );
  const round1 = (v: number | null): number | null =>
    v === null ? null : Math.round(v * 10) / 10;
  return {
    roundsCount: row?.rc ?? 0,
    bestScore: row?.best_score ?? null,
    bestDifferential: round1(row?.best_diff ?? null),
    averageScore: row?.avg_score ?? null,
    averageDifferential: round1(row?.avg_diff ?? null),
    mostPlayedTeeId: teeRow?.tee_id ?? null,
    lastPlayedAt: row?.last_played ?? null,
  };
}

export interface TroubleHole {
  holeNumber: number;
  par: number;
  averageScore: number;
  averageOverPar: number;
}

export function getTroubleHoles(
  db: Db,
  courseId: number,
  playerId: number,
  limit = 3,
): TroubleHole[] {
  return db.getAllSync<TroubleHole>(
    `SELECT hs.hole_number AS holeNumber,
            hs.par         AS par,
            AVG(hs.strokes) AS averageScore,
            AVG(hs.strokes - hs.par) AS averageOverPar
       FROM hole_scores hs
       JOIN rounds r ON r.id = hs.round_id
      WHERE r.course_id = ? AND r.player_id = ?
      GROUP BY hs.hole_number, hs.par
      ORDER BY averageOverPar DESC
      LIMIT ?`,
    [courseId, playerId, limit],
  );
}

export interface CourseDifferentialPoint {
  /** ISO timestamp the round was played at. */
  date: string;
  differential: number;
}

export function getRoundDifferentialsAtCourse(
  db: Db,
  courseId: number,
  playerId: number,
): CourseDifferentialPoint[] {
  return db.getAllSync<CourseDifferentialPoint>(
    `SELECT played_at AS date, score_differential AS differential
       FROM rounds
      WHERE course_id = ? AND player_id = ? AND score_differential IS NOT NULL
      ORDER BY played_at ASC`,
    [courseId, playerId],
  );
}
