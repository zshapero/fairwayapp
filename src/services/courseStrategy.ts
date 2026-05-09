import { getDb } from '@/core/db/database';
import { listHoleScoresForRound } from '@/core/db/repositories/holeScores';
import { listRoundsAtCourseForPlayer } from '@/core/db/repositories/rounds';
import { listTeeHoles } from '@/core/db/repositories/teeHoles';
import {
  generateHoleStrategies as generateHoleStrategiesPure,
  type HoleStrategy,
  type HolePlay,
  type HolePlaysInput,
} from '@/core/scoring/holeStrategy';

export type { HoleStrategy } from '@/core/scoring/holeStrategy';

/**
 * Pull a player's round history at a course out of SQLite, group it
 * hole-by-hole, and run the pure strategy generator. Returns one entry
 * per hole that has at least 3 plays.
 */
export function generateHoleStrategies(
  courseId: number,
  playerId: number,
): HoleStrategy[] {
  const db = getDb();
  const rounds = listRoundsAtCourseForPlayer(db, playerId, courseId);
  if (rounds.length === 0) return [];

  // Determine the par-per-hole reference. Use the most-recently-played
  // tee's holes; that's good enough for showing tendency cards even when
  // par is identical across tees (it usually is).
  const mostRecentTeeId = rounds[0].tee_id;
  const teeHoles = listTeeHoles(db, mostRecentTeeId);
  const parByHole = new Map<number, number>();
  for (const th of teeHoles) parByHole.set(th.hole_number, th.par);

  // Walk rounds in chronological order (oldest → newest) so the "recent
  // window" used inside the pure generator naturally lines up with the
  // last N plays.
  const chronological = [...rounds].sort((a, b) =>
    a.played_at.localeCompare(b.played_at),
  );
  const playsByHole = new Map<number, HolePlay[]>();
  for (const round of chronological) {
    const scores = listHoleScoresForRound(db, round.id);
    for (const s of scores) {
      const list = playsByHole.get(s.hole_number) ?? [];
      list.push({
        strokes: s.strokes,
        fairwayHit:
          s.fairway_hit === 1 ? true : s.fairway_hit === 0 ? false : null,
        greenInRegulation:
          s.green_in_regulation === 1
            ? true
            : s.green_in_regulation === 0
              ? false
              : null,
        putts: s.putts,
        // We don't yet store miss directions on hole_scores. The pure
        // generator handles the absence gracefully.
        fairwayMissDirection: null,
        greenMissDirection: null,
      });
      playsByHole.set(s.hole_number, list);
    }
  }

  const inputs: HolePlaysInput[] = [];
  for (const [holeNumber, plays] of playsByHole) {
    inputs.push({
      holeNumber,
      par: parByHole.get(holeNumber) ?? 4,
      plays,
    });
  }
  return generateHoleStrategiesPure(inputs);
}

/** Quick "have we played this course enough to surface tips?" gate. */
export function priorRoundsCount(courseId: number, playerId: number): number {
  return listRoundsAtCourseForPlayer(getDb(), playerId, courseId).length;
}
