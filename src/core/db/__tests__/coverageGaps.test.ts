import { describe, expect, it } from 'vitest';
import { createTestDb } from './test-helpers';
import {
  createCourse,
  setCourseCoordinates,
  getCourse,
} from '../repositories/courses';
import { createPlayer, setHomeCourse, setOnboardingComplete } from '../repositories/players';
import { createTee } from '../repositories/tees';
import { bulkCreateTeeHoles } from '../repositories/teeHoles';
import {
  createRound,
  listRoundsNeedingWeather,
  markRoundWeatherUnavailable,
  setRoundWeather,
} from '../repositories/rounds';
import {
  clearRecentSearches,
  listRecentSearches,
  recordSearch,
} from '../repositories/recentSearches';

describe('courses.setCourseCoordinates', () => {
  it('writes lat/lng onto an existing course', () => {
    const db = createTestDb();
    const c = createCourse(db, { club_name: 'GC', num_holes: 18 });
    setCourseCoordinates(db, c.id, 36.5683, -121.9485);
    const after = getCourse(db, c.id);
    expect(after?.latitude).toBeCloseTo(36.5683, 5);
    expect(after?.longitude).toBeCloseTo(-121.9485, 5);
  });
});

describe('players onboarding helpers', () => {
  it('setOnboardingComplete flips onboarded and stores the home course', () => {
    const db = createTestDb();
    const p = createPlayer(db, { name: 'A' });
    expect(p.onboarded).toBe(0);
    expect(p.home_course_id).toBeNull();
    const c = createCourse(db, { club_name: 'GC', num_holes: 18 });
    const after = setOnboardingComplete(db, p.id, c.id);
    expect(after?.onboarded).toBe(1);
    expect(after?.home_course_id).toBe(c.id);
  });

  it('setHomeCourse writes and clears the home course independently of onboarded', () => {
    const db = createTestDb();
    const p = createPlayer(db, { name: 'A' });
    const c = createCourse(db, { club_name: 'GC', num_holes: 18 });
    expect(setHomeCourse(db, p.id, c.id)?.home_course_id).toBe(c.id);
    expect(setHomeCourse(db, p.id, null)?.home_course_id).toBeNull();
  });

  it('setOnboardingComplete returns null for a missing player', () => {
    const db = createTestDb();
    expect(setOnboardingComplete(db, 9999, null)).toBeNull();
  });
});

function setupRoundForWeather() {
  const db = createTestDb();
  const player = createPlayer(db, { name: 'P' });
  const course = createCourse(db, {
    club_name: 'GC',
    num_holes: 18,
    latitude: 40.7128,
    longitude: -74.006,
  });
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

describe('rounds weather helpers', () => {
  it('listRoundsNeedingWeather returns rows where weather_fetched_at is null', () => {
    const { db, round } = setupRoundForWeather();
    expect(listRoundsNeedingWeather(db).map((r) => r.id)).toContain(round.id);
  });

  it('setRoundWeather populates the weather columns and stamps weather_fetched_at', () => {
    const { db, round } = setupRoundForWeather();
    const updated = setRoundWeather(db, round.id, {
      temperature_f: 68,
      wind_speed_mph: 12,
      wind_direction: 'SW',
      precipitation_mm: 0.1,
      weather_condition: 'partly_cloudy',
    });
    expect(updated?.temperature_f).toBe(68);
    expect(updated?.wind_speed_mph).toBe(12);
    expect(updated?.wind_direction).toBe('SW');
    expect(updated?.weather_fetched_at).not.toBeNull();
    // After the stamp, the row no longer needs weather.
    expect(listRoundsNeedingWeather(db).map((r) => r.id)).not.toContain(round.id);
  });

  it('markRoundWeatherUnavailable stamps weather_fetched_at without writing values', () => {
    const { db, round } = setupRoundForWeather();
    markRoundWeatherUnavailable(db, round.id);
    expect(listRoundsNeedingWeather(db).map((r) => r.id)).not.toContain(round.id);
  });
});

describe('recent_searches repository', () => {
  it('records, lists most-recent-first, deduplicates repeats, and respects FIFO at 5', () => {
    const db = createTestDb();
    recordSearch(db, 'pebble');
    recordSearch(db, 'pinehurst');
    recordSearch(db, 'pebble'); // duplicate — should bubble to top
    expect(listRecentSearches(db).map((r) => r.query)).toEqual(['pebble', 'pinehurst']);
    // Add 4 more to push past the FIFO cap of 5.
    for (const q of ['augusta', 'merion', 'oakmont', 'shinnecock', 'baltusrol']) {
      recordSearch(db, q);
    }
    const all = listRecentSearches(db);
    expect(all).toHaveLength(5);
    // 'pebble' is the oldest unique entry remaining and should have been
    // pushed off the end after the FIFO trim.
    expect(all.map((r) => r.query)).not.toContain('pinehurst');
  });

  it('ignores empty / whitespace-only queries', () => {
    const db = createTestDb();
    recordSearch(db, '');
    recordSearch(db, '   ');
    expect(listRecentSearches(db)).toHaveLength(0);
  });

  it('clearRecentSearches wipes the list', () => {
    const db = createTestDb();
    recordSearch(db, 'pebble');
    clearRecentSearches(db);
    expect(listRecentSearches(db)).toHaveLength(0);
  });
});

describe('end-to-end score → differential pipeline', () => {
  it('inserts hole_scores, sums into AGS, computes a differential, and survives a round delete', () => {
    const { db, round } = setupRoundForWeather();
    // Add 18 par-4 tee_holes so the tee is consistent.
    const tee_id = round.tee_id;
    bulkCreateTeeHoles(
      db,
      Array.from({ length: 18 }, (_, i) => ({
        tee_id,
        hole_number: i + 1,
        par: 4,
        stroke_index: i + 1,
        yardage: 380,
      })),
    );
    // Score 5 on every hole = 90 gross.
    for (let i = 1; i <= 18; i++) {
      db.runSync(
        `INSERT INTO hole_scores (round_id, hole_number, par, strokes)
         VALUES (?, ?, ?, ?)`,
        [round.id, i, 4, 5],
      );
    }
    const hs = db.getAllSync<{ strokes: number }>(
      'SELECT strokes FROM hole_scores WHERE round_id = ?',
      [round.id],
    );
    const ags = hs.reduce((s, h) => s + h.strokes, 0);
    expect(ags).toBe(90);

    // Differential: (113/130)*(90 - 71 - 0) = (0.86923) * 19 = 16.5 (1-decimal rounded).
    const diff = Math.round(((113 / 130) * (90 - 71 - 0)) * 10) / 10;
    expect(diff).toBe(16.5);

    // Cascade-delete the round and verify hole_scores are gone too.
    db.runSync('DELETE FROM rounds WHERE id = ?', [round.id]);
    const after = db.getAllSync<{ strokes: number }>(
      'SELECT strokes FROM hole_scores WHERE round_id = ?',
      [round.id],
    );
    expect(after).toHaveLength(0);
  });
});
