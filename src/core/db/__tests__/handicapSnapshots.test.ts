import { describe, it, expect } from 'vitest';
import { createTestDb } from './test-helpers';
import { createPlayer } from '../repositories/players';
import { createCourse } from '../repositories/courses';
import { createTee } from '../repositories/tees';
import { createRound, deleteRound } from '../repositories/rounds';
import {
  countHandicapSnapshots,
  createHandicapSnapshot,
  getLatestSnapshot,
  listSnapshotsForPlayer,
} from '../repositories/handicapSnapshots';

describe('handicap_snapshots repository', () => {
  it('creates a snapshot and returns it as the latest', () => {
    const db = createTestDb();
    const p = createPlayer(db, { name: 'P' });
    const snap = createHandicapSnapshot(db, {
      player_id: p.id,
      handicap_index: 12.4,
      rounds_used_count: 8,
    });
    expect(snap.handicap_index).toBe(12.4);
    expect(getLatestSnapshot(db, p.id)?.id).toBe(snap.id);
  });

  it('lists snapshots most recent first', () => {
    const db = createTestDb();
    const p = createPlayer(db, { name: 'P' });
    createHandicapSnapshot(db, { player_id: p.id, handicap_index: 15.0, rounds_used_count: 5 });
    createHandicapSnapshot(db, { player_id: p.id, handicap_index: 14.0, rounds_used_count: 6 });
    const list = listSnapshotsForPlayer(db, p.id);
    expect(list).toHaveLength(2);
    expect(list[0].handicap_index).toBe(14.0);
    expect(countHandicapSnapshots(db)).toBe(2);
  });

  it('SET NULLs triggering_round_id when the round is deleted', () => {
    const db = createTestDb();
    const p = createPlayer(db, { name: 'P' });
    const c = createCourse(db, { club_name: 'GC', num_holes: 18 });
    const tee = createTee(db, {
      course_id: c.id,
      tee_name: 'Blue',
      course_rating: 71,
      slope_rating: 130,
    });
    const r = createRound(db, {
      player_id: p.id,
      course_id: c.id,
      tee_id: tee.id,
      played_at: '2024-06-01T00:00:00Z',
      num_holes_played: 18,
      pcc: 0,
      course_handicap: 10,
    });
    const snap = createHandicapSnapshot(db, {
      player_id: p.id,
      handicap_index: 10.5,
      rounds_used_count: 8,
      triggering_round_id: r.id,
    });
    expect(snap.triggering_round_id).toBe(r.id);
    deleteRound(db, r.id);
    expect(getLatestSnapshot(db, p.id)?.triggering_round_id).toBeNull();
  });
});
