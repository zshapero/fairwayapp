import { describe, it, expect } from 'vitest';
import { createTestDb } from './test-helpers';
import {
  countCourses,
  createCourse,
  deleteCourse,
  getCourse,
  listCourses,
  setFavorite,
} from '../repositories/courses';

describe('courses repository', () => {
  it('creates a course with defaults', () => {
    const db = createTestDb();
    const c = createCourse(db, { club_name: 'Test GC', num_holes: 18 });
    expect(c.club_name).toBe('Test GC');
    expect(c.num_holes).toBe(18);
    expect(c.is_favorite).toBe(0);
  });

  it('lists courses ordered by club_name', () => {
    const db = createTestDb();
    createCourse(db, { club_name: 'Z Club', num_holes: 18 });
    createCourse(db, { club_name: 'A Club', num_holes: 9 });
    expect(listCourses(db).map((c) => c.club_name)).toEqual(['A Club', 'Z Club']);
  });

  it('toggles favorite flag', () => {
    const db = createTestDb();
    const c = createCourse(db, { club_name: 'Fav', num_holes: 18 });
    setFavorite(db, c.id, 1);
    expect(getCourse(db, c.id)?.is_favorite).toBe(1);
  });

  it('deletes a course', () => {
    const db = createTestDb();
    const c = createCourse(db, { club_name: 'Delete me', num_holes: 18 });
    deleteCourse(db, c.id);
    expect(countCourses(db)).toBe(0);
  });
});
