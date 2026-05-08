import { describe, it, expect } from 'vitest';
import { createTestDb } from './test-helpers';
import { createCourse } from '../repositories/courses';
import { createTee } from '../repositories/tees';
import {
  bulkCreateTeeHoles,
  countTeeHoles,
  getTeeHole,
  listTeeHoles,
} from '../repositories/teeHoles';

describe('tee_holes repository', () => {
  it('bulk-inserts tee holes for a tee and lists them by hole_number', () => {
    const db = createTestDb();
    const c = createCourse(db, { club_name: 'GC', num_holes: 18 });
    const tee = createTee(db, {
      course_id: c.id,
      tee_name: 'Blue',
      course_rating: 71,
      slope_rating: 130,
    });
    bulkCreateTeeHoles(
      db,
      Array.from({ length: 18 }, (_, i) => ({
        tee_id: tee.id,
        hole_number: i + 1,
        par: 4,
        yardage: 350 + i,
        stroke_index: i + 1,
      })),
    );
    const holes = listTeeHoles(db, tee.id);
    expect(holes).toHaveLength(18);
    expect(holes[0].hole_number).toBe(1);
    expect(holes[17].hole_number).toBe(18);
    expect(countTeeHoles(db)).toBe(18);
  });

  it('retrieves a single tee hole by id', () => {
    const db = createTestDb();
    const c = createCourse(db, { club_name: 'GC', num_holes: 18 });
    const tee = createTee(db, {
      course_id: c.id,
      tee_name: 'Blue',
      course_rating: 71,
      slope_rating: 130,
    });
    bulkCreateTeeHoles(db, [
      { tee_id: tee.id, hole_number: 1, par: 4, stroke_index: 7 },
    ]);
    const [hole] = listTeeHoles(db, tee.id);
    expect(getTeeHole(db, hole.id)?.stroke_index).toBe(7);
  });
});
