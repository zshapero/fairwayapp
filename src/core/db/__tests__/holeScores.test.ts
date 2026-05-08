import { describe, it, expect } from 'vitest';
import { createTestDb } from './test-helpers';
import { createPlayer } from '../repositories/players';
import { createCourse } from '../repositories/courses';
import { createTee } from '../repositories/tees';
import { createRound } from '../repositories/rounds';
import {
  countHoleScores,
  createHoleScore,
  deleteHoleScoresForRound,
  listHoleScoresForRound,
} from '../repositories/holeScores';

function setupRound() {
  const db = createTestDb();
  const player = createPlayer(db, { name: 'P' });
  const course = createCourse(db, { club_name: 'GC', num_holes: 18 });
  const tee = createTee(db, {
    course_id: course.id,
    tee_name: 'Blue',
    course_rating: 71,
    slope_rating: 130,
  });
  const round = createRound(db, {
    player_id: player.id,
    course_id: course.id,
    tee_id: tee.id,
    played_at: '2024-06-01T00:00:00Z',
    num_holes_played: 18,
    pcc: 0,
    course_handicap: 12,
  });
  return { db, round };
}

describe('hole_scores repository', () => {
  it('creates and lists hole scores for a round in hole order', () => {
    const { db, round } = setupRound();
    createHoleScore(db, {
      round_id: round.id,
      hole_number: 2,
      par: 4,
      strokes: 5,
      putts: 2,
      fairway_hit: 1,
      green_in_regulation: 0,
    });
    createHoleScore(db, {
      round_id: round.id,
      hole_number: 1,
      par: 4,
      strokes: 4,
      fairway_hit: 1,
      green_in_regulation: 1,
    });
    const list = listHoleScoresForRound(db, round.id);
    expect(list.map((h) => h.hole_number)).toEqual([1, 2]);
    expect(list[0].green_in_regulation).toBe(1);
  });

  it('persists optional stat fields and nullable booleans', () => {
    const { db, round } = setupRound();
    const score = createHoleScore(db, {
      round_id: round.id,
      hole_number: 1,
      par: 4,
      strokes: 6,
      putts: null,
      fairway_hit: null,
    });
    expect(score.putts).toBeNull();
    expect(score.fairway_hit).toBeNull();
  });

  it('bulk-deletes hole scores for a round', () => {
    const { db, round } = setupRound();
    for (let h = 1; h <= 5; h++) {
      createHoleScore(db, { round_id: round.id, hole_number: h, par: 4, strokes: 5 });
    }
    expect(countHoleScores(db)).toBe(5);
    deleteHoleScoresForRound(db, round.id);
    expect(countHoleScores(db)).toBe(0);
  });
});
