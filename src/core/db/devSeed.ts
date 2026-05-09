import type { Db } from './db';
import { createPlayer, listPlayers } from './repositories/players';
import { listCourses } from './repositories/courses';
import { listTeesForCourse } from './repositories/tees';
import { listTeeHoles } from './repositories/teeHoles';
import { createRound, listRoundsForPlayer } from './repositories/rounds';
import { createHoleScore, listHoleScoresForRound } from './repositories/holeScores';
import {
  createHandicapSnapshot,
  listSnapshotsForPlayer,
} from './repositories/handicapSnapshots';
import { seedDemoData } from './seed';

/**
 * Idempotent dev-only seed: creates one player, ensures the demo courses
 * exist, then seeds a single 18-hole round at Pebble Beach plus 28 weekly
 * handicap snapshots so the home screen and round-detail screen have real
 * data to render.
 *
 * Safe to call on every app start; bails if a round already exists.
 */
export function seedDevContent(db: Db): { playerId: number; roundId: number | null } {
  // Ensure courses exist.
  if (listCourses(db).length === 0) {
    seedDemoData(db);
  }

  // Default player.
  let player = listPlayers(db)[0];
  if (player === undefined) {
    player = createPlayer(db, { name: 'You', gender: 'M' });
  }
  // Seeded dev players skip onboarding — onboarding only fires after a real
  // "Clear all data" reset (which removes the player row entirely).
  if (player.onboarded === 0) {
    db.runSync('UPDATE players SET onboarded = 1 WHERE id = ?', [player.id]);
    player = listPlayers(db)[0]!;
  }

  const existingRounds = listRoundsForPlayer(db, player.id);
  if (existingRounds.length > 0) {
    return { playerId: player.id, roundId: existingRounds[0].id };
  }

  const pebble = listCourses(db).find(
    (c) => c.external_id === 'demo:pebble-beach',
  );
  if (pebble === undefined) return { playerId: player.id, roundId: null };
  const tee = listTeesForCourse(db, pebble.id)[0];
  if (tee === undefined) return { playerId: player.id, roundId: null };
  const teeHoles = listTeeHoles(db, tee.id);

  // Hand-tuned scores. Mostly bogey golf with one birdie and one blow-up hole.
  const STROKES = [5, 6, 5, 4, 4, 6, 4, 5, 5, 5, 5, 3, 5, 6, 5, 4, 4, 7];
  const PUTTS = [2, 2, 2, 1, 2, 3, 2, 2, 2, 2, 2, 1, 2, 3, 2, 2, 2, 3];

  const playedAt = new Date(Date.now() - 4 * 86_400_000).toISOString();
  const round = createRound(db, {
    player_id: player.id,
    course_id: pebble.id,
    tee_id: tee.id,
    played_at: playedAt,
    num_holes_played: 18,
    pcc: 0,
    course_handicap: 16,
    adjusted_gross_score: STROKES.reduce((a, b) => a + b, 0),
    score_differential: 18.7,
    notes: null,
  });

  for (let i = 0; i < 18; i++) {
    const teeHole = teeHoles[i];
    createHoleScore(db, {
      round_id: round.id,
      hole_number: teeHole.hole_number,
      par: teeHole.par,
      strokes: STROKES[i],
      putts: PUTTS[i],
      fairway_hit: i % 3 === 0 ? 1 : 0,
      green_in_regulation: STROKES[i] - PUTTS[i] <= teeHole.par - 2 ? 1 : 0,
    });
  }

  // Seed weekly handicap snapshots so the home chart has data — only if absent.
  if (listSnapshotsForPlayer(db, player.id).length === 0) {
    const SERIES = [
      18.6, 18.4, 18.5, 18.1, 17.7, 17.9, 17.4, 17.0, 17.2, 16.8, 16.6, 16.9,
      16.4, 16.0, 15.7, 15.9, 15.5, 15.0, 14.6, 14.2, 14.5, 14.3, 14.0, 14.2,
      13.8, 14.0, 14.4, 14.2,
    ];
    for (let i = 0; i < SERIES.length; i++) {
      const daysAgo = (SERIES.length - 1 - i) * 6;
      const calculatedAt = new Date(Date.now() - daysAgo * 86_400_000).toISOString();
      const snap = createHandicapSnapshot(db, {
        player_id: player.id,
        handicap_index: SERIES[i],
        rounds_used_count: Math.min(8, i + 3),
        triggering_round_id: i === SERIES.length - 1 ? round.id : null,
      });
      // Pin calculated_at so the chart shows the chronological spread.
      db.runSync('UPDATE handicap_snapshots SET calculated_at = ? WHERE id = ?', [
        calculatedAt,
        snap.id,
      ]);
    }
  }

  // Verify hole_scores were inserted; otherwise return null roundId.
  const holes = listHoleScoresForRound(db, round.id);
  return { playerId: player.id, roundId: holes.length > 0 ? round.id : null };
}
