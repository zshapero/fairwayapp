import { describe, it, expect } from 'vitest';
import { createTestDb } from './test-helpers';
import { createCourse } from '../repositories/courses';
import {
  countTees,
  createTee,
  deleteTee,
  getTee,
  listTeesForCourse,
} from '../repositories/tees';
import { createTeeHole, listTeeHoles } from '../repositories/teeHoles';

describe('tees repository', () => {
  it('creates a tee tied to a course', () => {
    const db = createTestDb();
    const course = createCourse(db, { club_name: 'GC', num_holes: 18 });
    const tee = createTee(db, {
      course_id: course.id,
      tee_name: 'Blue',
      course_rating: 71.5,
      slope_rating: 130,
    });
    expect(tee.course_id).toBe(course.id);
    expect(tee.course_rating).toBe(71.5);
  });

  it('lists tees for a course', () => {
    const db = createTestDb();
    const c = createCourse(db, { club_name: 'GC', num_holes: 18 });
    createTee(db, { course_id: c.id, tee_name: 'Blue', course_rating: 71, slope_rating: 130 });
    createTee(db, { course_id: c.id, tee_name: 'White', course_rating: 69, slope_rating: 120 });
    expect(listTeesForCourse(db, c.id)).toHaveLength(2);
  });

  it('cascades tee deletion to its tee_holes', () => {
    const db = createTestDb();
    const c = createCourse(db, { club_name: 'GC', num_holes: 18 });
    const tee = createTee(db, {
      course_id: c.id,
      tee_name: 'Blue',
      course_rating: 71,
      slope_rating: 130,
    });
    createTeeHole(db, { tee_id: tee.id, hole_number: 1, par: 4, stroke_index: 1 });
    expect(listTeeHoles(db, tee.id)).toHaveLength(1);
    deleteTee(db, tee.id);
    expect(getTee(db, tee.id)).toBeNull();
    expect(listTeeHoles(db, tee.id)).toHaveLength(0);
  });

  it('cascades course deletion to its tees', () => {
    const db = createTestDb();
    const c = createCourse(db, { club_name: 'GC', num_holes: 18 });
    createTee(db, { course_id: c.id, tee_name: 'Blue', course_rating: 71, slope_rating: 130 });
    db.runSync('DELETE FROM courses WHERE id = ?', [c.id]);
    expect(countTees(db)).toBe(0);
  });
});
