import { describe, it, expect } from 'vitest';
import { createTestDb } from './test-helpers';
import { createPlayer } from '../repositories/players';
import { createCourse } from '../repositories/courses';
import { createTee } from '../repositories/tees';
import {
  countRounds,
  createRound,
  deleteRound,
  getRound,
  listRoundsForPlayer,
  updateRound,
  updateRoundResults,
} from '../repositories/rounds';
import { createHoleScore, countHoleScores } from '../repositories/holeScores';

function setup() {
  const db = createTestDb();
  const player = createPlayer(db, { name: 'P' });
  const course = createCourse(db, { club_name: 'GC', num_holes: 18 });
  const tee = createTee(db, {
    course_id: course.id,
    tee_name: 'Blue',
    course_rating: 71.0,
    slope_rating: 130,
  });
  return { db, player, course, tee };
}

describe('rounds repository', () => {
  it('creates a round with foreign keys to player/course/tee', () => {
    const { db, player, course, tee } = setup();
    const round = createRound(db, {
      player_id: player.id,
      course_id: course.id,
      tee_id: tee.id,
      played_at: '2024-06-01T15:00:00Z',
      num_holes_played: 18,
      pcc: 0,
      course_handicap: 12,
    });
    expect(round.player_id).toBe(player.id);
    expect(round.course_handicap).toBe(12);
  });

  it('lists rounds for a player ordered by played_at descending', () => {
    const { db, player, course, tee } = setup();
    createRound(db, {
      player_id: player.id,
      course_id: course.id,
      tee_id: tee.id,
      played_at: '2024-06-01T00:00:00Z',
      num_holes_played: 18,
      pcc: 0,
      course_handicap: 10,
    });
    createRound(db, {
      player_id: player.id,
      course_id: course.id,
      tee_id: tee.id,
      played_at: '2024-07-01T00:00:00Z',
      num_holes_played: 18,
      pcc: 0,
      course_handicap: 10,
    });
    const list = listRoundsForPlayer(db, player.id);
    expect(list[0].played_at).toBe('2024-07-01T00:00:00Z');
  });

  it('updates AGS and score differential', () => {
    const { db, player, course, tee } = setup();
    const r = createRound(db, {
      player_id: player.id,
      course_id: course.id,
      tee_id: tee.id,
      played_at: '2024-06-01T00:00:00Z',
      num_holes_played: 18,
      pcc: 0,
      course_handicap: 12,
    });
    const updated = updateRoundResults(db, r.id, {
      adjusted_gross_score: 92,
      score_differential: 18.3,
    });
    expect(updated?.adjusted_gross_score).toBe(92);
    expect(updated?.score_differential).toBe(18.3);
  });

  it('persists notes via updateRound and preserves other fields', () => {
    const { db, player, course, tee } = setup();
    const r = createRound(db, {
      player_id: player.id,
      course_id: course.id,
      tee_id: tee.id,
      played_at: '2024-06-01T00:00:00Z',
      num_holes_played: 18,
      pcc: 0,
      course_handicap: 12,
      adjusted_gross_score: 92,
      score_differential: 18.4,
    });
    const updated = updateRound(db, r.id, { notes: 'Birdied 7. Lost ball on 14.' });
    expect(updated?.notes).toBe('Birdied 7. Lost ball on 14.');
    expect(updated?.adjusted_gross_score).toBe(92);
    expect(updated?.score_differential).toBe(18.4);
    // Round-trip after a re-read.
    expect(getRound(db, r.id)?.notes).toBe('Birdied 7. Lost ball on 14.');
  });

  it('updateRound returns null for missing rounds', () => {
    const { db } = setup();
    expect(updateRound(db, 9999, { notes: 'x' })).toBeNull();
  });

  it('deleting a round cascades to its hole_scores', () => {
    const { db, player, course, tee } = setup();
    const r = createRound(db, {
      player_id: player.id,
      course_id: course.id,
      tee_id: tee.id,
      played_at: '2024-06-01T00:00:00Z',
      num_holes_played: 18,
      pcc: 0,
      course_handicap: 12,
    });
    for (let h = 1; h <= 3; h++) {
      createHoleScore(db, { round_id: r.id, hole_number: h, par: 4, strokes: 5 });
    }
    expect(countHoleScores(db)).toBe(3);
    deleteRound(db, r.id);
    expect(getRound(db, r.id)).toBeNull();
    expect(countHoleScores(db)).toBe(0);
    expect(countRounds(db)).toBe(0);
  });
});
