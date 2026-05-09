import { describe, expect, it } from 'vitest';
import { createTestDb } from '@/core/db/__tests__/test-helpers';
import { createPlayer } from '@/core/db/repositories/players';
import { createCourse } from '@/core/db/repositories/courses';
import { createTee } from '@/core/db/repositories/tees';
import { createRound, deleteRound } from '@/core/db/repositories/rounds';
import {
  createHandicapSnapshot,
  listSnapshotsForPlayer,
} from '@/core/db/repositories/handicapSnapshots';
import { recomputeSnapshotsFromDate } from '../snapshotRecompute';

function setup() {
  const db = createTestDb();
  const player = createPlayer(db, { name: 'P' });
  const course = createCourse(db, { club_name: 'GC', num_holes: 18 });
  const tee = createTee(db, {
    course_id: course.id,
    tee_name: 'Blue',
    course_rating: 71,
    slope_rating: 130,
  });
  return { db, player, course, tee };
}

describe('recomputeSnapshotsFromDate', () => {
  it('rewrites snapshots for rounds on or after the cutoff and leaves earlier ones alone', () => {
    const { db, player, course, tee } = setup();
    // Three rounds with differentials.
    const r1 = createRound(db, {
      player_id: player.id,
      course_id: course.id,
      tee_id: tee.id,
      played_at: '2024-01-01T00:00:00Z',
      num_holes_played: 18,
      pcc: 0,
      course_handicap: 12,
      score_differential: 18.0,
    });
    const r2 = createRound(db, {
      player_id: player.id,
      course_id: course.id,
      tee_id: tee.id,
      played_at: '2024-02-01T00:00:00Z',
      num_holes_played: 18,
      pcc: 0,
      course_handicap: 12,
      score_differential: 16.0,
    });
    const r3 = createRound(db, {
      player_id: player.id,
      course_id: course.id,
      tee_id: tee.id,
      played_at: '2024-03-01T00:00:00Z',
      num_holes_played: 18,
      pcc: 0,
      course_handicap: 12,
      score_differential: 14.0,
    });

    // Pre-existing snapshots — use the helper to seed via DB.
    createHandicapSnapshot(db, {
      player_id: player.id,
      handicap_index: 18.0,
      rounds_used_count: 1,
      triggering_round_id: r1.id,
    });
    createHandicapSnapshot(db, {
      player_id: player.id,
      handicap_index: 16.0,
      rounds_used_count: 2,
      triggering_round_id: r2.id,
    });
    createHandicapSnapshot(db, {
      player_id: player.id,
      handicap_index: 14.0,
      rounds_used_count: 3,
      triggering_round_id: r3.id,
    });
    db.runSync('UPDATE handicap_snapshots SET calculated_at = ? WHERE triggering_round_id = ?', [
      '2024-01-01T00:00:00Z',
      r1.id,
    ]);
    db.runSync('UPDATE handicap_snapshots SET calculated_at = ? WHERE triggering_round_id = ?', [
      '2024-02-01T00:00:00Z',
      r2.id,
    ]);
    db.runSync('UPDATE handicap_snapshots SET calculated_at = ? WHERE triggering_round_id = ?', [
      '2024-03-01T00:00:00Z',
      r3.id,
    ]);

    // Delete the middle round and recompute from its date forward.
    deleteRound(db, r2.id);
    recomputeSnapshotsFromDate(db, player.id, '2024-02-01T00:00:00Z');

    const all = listSnapshotsForPlayer(db, player.id).reverse();
    // r1's snapshot should be untouched.
    expect(all[0].triggering_round_id).toBe(r1.id);
    // The post-cutoff snapshot is now r3 alone, computed from the surviving
    // pair of differentials [18.0, 14.0]. With 2 differentials handicapIndex
    // returns null (need ≥3), so no snapshot is written for r3.
    expect(all.find((s) => s.triggering_round_id === r3.id)).toBeUndefined();
  });

  it('writes a snapshot once the rolling differentials count reaches three', () => {
    const { db, player, course, tee } = setup();
    for (let i = 0; i < 5; i++) {
      createRound(db, {
        player_id: player.id,
        course_id: course.id,
        tee_id: tee.id,
        played_at: `2024-0${i + 1}-01T00:00:00Z`,
        num_holes_played: 18,
        pcc: 0,
        course_handicap: 12,
        score_differential: 18 - i,
      });
    }
    const result = recomputeSnapshotsFromDate(db, player.id, '0000-01-01T00:00:00Z');
    // 3 snapshots: rounds 3, 4, 5 (the first two are not enough to compute).
    expect(result.written).toBe(3);
    const all = listSnapshotsForPlayer(db, player.id);
    expect(all).toHaveLength(3);
  });
});
