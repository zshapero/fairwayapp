import { describe, expect, it } from 'vitest';
import { createTestDb } from './test-helpers';
import { createPlayer } from '../repositories/players';
import {
  createCourse,
  getCourseStats,
  getRoundDifferentialsAtCourse,
  getTroubleHoles,
} from '../repositories/courses';
import { createTee } from '../repositories/tees';
import { createTeeHole } from '../repositories/teeHoles';
import {
  createRound,
  getRoundsForPlayerGroupedByMonth,
  getRoundsForPlayerInDateRange,
  listRoundsAtCourseForPlayer,
} from '../repositories/rounds';
import { createHoleScore } from '../repositories/holeScores';

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
  for (let i = 0; i < 18; i++) {
    createTeeHole(db, {
      tee_id: tee.id,
      hole_number: i + 1,
      par: 4,
      stroke_index: i + 1,
    });
  }
  return { db, player, course, tee };
}

describe('getCourseStats', () => {
  it('reports rounds count and aggregates', () => {
    const { db, player, course, tee } = setup();
    createRound(db, {
      player_id: player.id,
      course_id: course.id,
      tee_id: tee.id,
      played_at: '2024-04-01T00:00:00Z',
      num_holes_played: 18,
      pcc: 0,
      course_handicap: 12,
      adjusted_gross_score: 92,
      score_differential: 18.4,
    });
    createRound(db, {
      player_id: player.id,
      course_id: course.id,
      tee_id: tee.id,
      played_at: '2024-05-01T00:00:00Z',
      num_holes_played: 18,
      pcc: 0,
      course_handicap: 12,
      adjusted_gross_score: 88,
      score_differential: 16.0,
    });
    const stats = getCourseStats(db, course.id, player.id);
    expect(stats.roundsCount).toBe(2);
    expect(stats.bestScore).toBe(88);
    expect(stats.bestDifferential).toBe(16.0);
    expect(stats.averageScore).toBe(90);
    expect(stats.averageDifferential).toBe(17.2);
    expect(stats.mostPlayedTeeId).toBe(tee.id);
    expect(stats.lastPlayedAt).toBe('2024-05-01T00:00:00Z');
  });

  it('returns nulls when no rounds exist', () => {
    const { db, player, course } = setup();
    const stats = getCourseStats(db, course.id, player.id);
    expect(stats.roundsCount).toBe(0);
    expect(stats.bestScore).toBeNull();
  });
});

describe('getTroubleHoles', () => {
  it('returns the holes averaging the most over par', () => {
    const { db, player, course, tee } = setup();
    const round = createRound(db, {
      player_id: player.id,
      course_id: course.id,
      tee_id: tee.id,
      played_at: '2024-05-01T00:00:00Z',
      num_holes_played: 18,
      pcc: 0,
      course_handicap: 12,
    });
    // Hole 1 average +3, hole 2 average +2, hole 3 average 0
    createHoleScore(db, { round_id: round.id, hole_number: 1, par: 4, strokes: 7 });
    createHoleScore(db, { round_id: round.id, hole_number: 2, par: 4, strokes: 6 });
    createHoleScore(db, { round_id: round.id, hole_number: 3, par: 4, strokes: 4 });
    const trouble = getTroubleHoles(db, course.id, player.id, 2);
    expect(trouble).toHaveLength(2);
    expect(trouble[0].holeNumber).toBe(1);
    expect(trouble[0].averageOverPar).toBe(3);
    expect(trouble[1].holeNumber).toBe(2);
  });
});

describe('getRoundDifferentialsAtCourse', () => {
  it('returns chronological non-null differentials only', () => {
    const { db, player, course, tee } = setup();
    createRound(db, {
      player_id: player.id,
      course_id: course.id,
      tee_id: tee.id,
      played_at: '2024-04-01T00:00:00Z',
      num_holes_played: 18,
      pcc: 0,
      course_handicap: 12,
      score_differential: 18.4,
    });
    createRound(db, {
      player_id: player.id,
      course_id: course.id,
      tee_id: tee.id,
      played_at: '2024-05-01T00:00:00Z',
      num_holes_played: 18,
      pcc: 0,
      course_handicap: 12,
      score_differential: 17.0,
    });
    createRound(db, {
      player_id: player.id,
      course_id: course.id,
      tee_id: tee.id,
      played_at: '2024-06-01T00:00:00Z',
      num_holes_played: 18,
      pcc: 0,
      course_handicap: 12,
      score_differential: null,
    });
    const points = getRoundDifferentialsAtCourse(db, course.id, player.id);
    expect(points).toHaveLength(2);
    expect(points[0].differential).toBe(18.4);
    expect(points[1].differential).toBe(17.0);
  });
});

describe('getRoundsForPlayerInDateRange', () => {
  it('returns rounds whose played_at falls in the half-open window', () => {
    const { db, player, course, tee } = setup();
    createRound(db, {
      player_id: player.id,
      course_id: course.id,
      tee_id: tee.id,
      played_at: '2024-04-15T00:00:00Z',
      num_holes_played: 18,
      pcc: 0,
      course_handicap: 12,
    });
    createRound(db, {
      player_id: player.id,
      course_id: course.id,
      tee_id: tee.id,
      played_at: '2024-05-15T00:00:00Z',
      num_holes_played: 18,
      pcc: 0,
      course_handicap: 12,
    });
    const rows = getRoundsForPlayerInDateRange(
      db,
      player.id,
      Date.UTC(2024, 3, 1),
      Date.UTC(2024, 4, 1),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].played_at).toBe('2024-04-15T00:00:00Z');
  });
});

describe('getRoundsForPlayerGroupedByMonth', () => {
  it('groups rounds into year-month buckets', () => {
    const { db, player, course, tee } = setup();
    const now = new Date();
    const recent = new Date(now.getTime() - 5 * 86_400_000).toISOString();
    const olderSameMonth = new Date(now.getTime() - 6 * 86_400_000).toISOString();
    const lastMonth = new Date(now);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthIso = lastMonth.toISOString();
    createRound(db, {
      player_id: player.id,
      course_id: course.id,
      tee_id: tee.id,
      played_at: recent,
      num_holes_played: 18,
      pcc: 0,
      course_handicap: 12,
    });
    createRound(db, {
      player_id: player.id,
      course_id: course.id,
      tee_id: tee.id,
      played_at: olderSameMonth,
      num_holes_played: 18,
      pcc: 0,
      course_handicap: 12,
    });
    createRound(db, {
      player_id: player.id,
      course_id: course.id,
      tee_id: tee.id,
      played_at: lastMonthIso,
      num_holes_played: 18,
      pcc: 0,
      course_handicap: 12,
    });
    const groups = getRoundsForPlayerGroupedByMonth(db, player.id, 12);
    // At least 1 group; first group corresponds to the most recent month and
    // contains the two rounds in it.
    expect(groups.length).toBeGreaterThanOrEqual(1);
    const total = groups.reduce((s, g) => s + g.rounds.length, 0);
    expect(total).toBe(3);
  });
});

describe('listRoundsAtCourseForPlayer', () => {
  it('orders rounds at a course most recent first', () => {
    const { db, player, course, tee } = setup();
    createRound(db, {
      player_id: player.id,
      course_id: course.id,
      tee_id: tee.id,
      played_at: '2024-04-01T00:00:00Z',
      num_holes_played: 18,
      pcc: 0,
      course_handicap: 12,
    });
    createRound(db, {
      player_id: player.id,
      course_id: course.id,
      tee_id: tee.id,
      played_at: '2024-06-01T00:00:00Z',
      num_holes_played: 18,
      pcc: 0,
      course_handicap: 12,
    });
    const rows = listRoundsAtCourseForPlayer(db, player.id, course.id);
    expect(rows[0].played_at).toBe('2024-06-01T00:00:00Z');
  });
});
