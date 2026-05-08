import { describe, it, expect } from 'vitest';
import { createTestDb } from './test-helpers';
import { seedDemoData } from '../seed';
import { listCourses } from '../repositories/courses';
import { listTeesForCourse } from '../repositories/tees';
import { listTeeHoles } from '../repositories/teeHoles';

describe('seedDemoData', () => {
  it('inserts both demo courses with full tee + hole data', () => {
    const db = createTestDb();
    const result = seedDemoData(db);
    expect(result.coursesAdded).toBe(2);
    const courses = listCourses(db);
    expect(courses).toHaveLength(2);
    for (const course of courses) {
      const tees = listTeesForCourse(db, course.id);
      expect(tees.length).toBeGreaterThan(0);
      for (const tee of tees) {
        expect(listTeeHoles(db, tee.id)).toHaveLength(18);
      }
    }
  });

  it('is idempotent on a second call', () => {
    const db = createTestDb();
    seedDemoData(db);
    const second = seedDemoData(db);
    expect(second.coursesAdded).toBe(0);
    expect(listCourses(db)).toHaveLength(2);
  });
});
