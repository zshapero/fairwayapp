import { describe, expect, it } from 'vitest';
import { createTestDb } from './test-helpers';
import { createPlayer } from '../repositories/players';
import { createCourse } from '../repositories/courses';
import { createTee } from '../repositories/tees';
import { createRound, deleteRound } from '../repositories/rounds';
import {
  addPhoto,
  countPhotosForRound,
  getPhoto,
  listPhotosForRound,
  removePhoto,
  updateCaption,
} from '../repositories/roundPhotos';

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

describe('roundPhotos repository', () => {
  it('adds, retrieves, and lists photos for a round in chronological order', () => {
    const { db, round } = setupRound();
    addPhoto(db, {
      id: 'b',
      round_id: round.id,
      file_uri: '/photos/b.jpg',
      taken_at: 200,
    });
    addPhoto(db, {
      id: 'a',
      round_id: round.id,
      file_uri: '/photos/a.jpg',
      taken_at: 100,
      caption: 'opening tee shot',
    });
    const photos = listPhotosForRound(db, round.id);
    expect(photos.map((p) => p.id)).toEqual(['a', 'b']);
    expect(photos[0].caption).toBe('opening tee shot');
    expect(getPhoto(db, 'a')?.id).toBe('a');
    expect(countPhotosForRound(db, round.id)).toBe(2);
  });

  it('updates a caption (and clears it via empty string)', () => {
    const { db, round } = setupRound();
    addPhoto(db, {
      id: 'p1',
      round_id: round.id,
      file_uri: '/photos/p1.jpg',
      taken_at: 100,
    });
    expect(updateCaption(db, 'p1', 'fairway from 12')?.caption).toBe(
      'fairway from 12',
    );
    expect(updateCaption(db, 'p1', '')?.caption).toBeNull();
  });

  it('removes a single photo', () => {
    const { db, round } = setupRound();
    addPhoto(db, {
      id: 'p1',
      round_id: round.id,
      file_uri: '/photos/p1.jpg',
      taken_at: 100,
    });
    removePhoto(db, 'p1');
    expect(getPhoto(db, 'p1')).toBeNull();
    expect(countPhotosForRound(db, round.id)).toBe(0);
  });

  it('cascades photo deletion when the parent round is deleted', () => {
    const { db, round } = setupRound();
    for (let i = 0; i < 3; i++) {
      addPhoto(db, {
        id: `p${i}`,
        round_id: round.id,
        file_uri: `/photos/p${i}.jpg`,
        taken_at: i * 100,
      });
    }
    expect(countPhotosForRound(db, round.id)).toBe(3);
    deleteRound(db, round.id);
    expect(listPhotosForRound(db, round.id)).toHaveLength(0);
  });
});
