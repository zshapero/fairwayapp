import type { Db } from '@/core/db/db';
import { handicapIndex } from '@/core/handicap';
import { listRoundsForPlayer } from '@/core/db/repositories/rounds';
import {
  createHandicapSnapshot,
  listSnapshotsForPlayer,
} from '@/core/db/repositories/handicapSnapshots';
import { timed } from './perfLogging';

/**
 * Walks the player's chronological round history and rebuilds the
 * handicap_snapshots table from {@link fromIso} forward.
 *
 * Implementation:
 *  1. Drop every existing snapshot whose calculated_at >= fromIso.
 *  2. Replay every round in chronological order; after each round, if a
 *     valid handicap_index can be computed from the differentials seen so
 *     far, write a new snapshot with triggering_round_id set to that round.
 *  3. Snapshot timestamps are pinned to the round's played_at so that the
 *     home-screen chart still spreads correctly chronologically.
 *
 * Returns the number of snapshots written.
 */
export function recomputeSnapshotsFromDate(
  db: Db,
  playerId: number,
  fromIso: string,
): { written: number } {
  return timed('snapshotRecompute', () => recomputeImpl(db, playerId, fromIso));
}

function recomputeImpl(
  db: Db,
  playerId: number,
  fromIso: string,
): { written: number } {
  // Wipe future snapshots first.
  db.runSync(
    'DELETE FROM handicap_snapshots WHERE player_id = ? AND calculated_at >= ?',
    [playerId, fromIso],
  );

  // The differentials BEFORE the cutoff still feed into the rolling
  // calculation; pull them out of the surviving rounds in order.
  const allRounds = listRoundsForPlayer(db, playerId)
    .slice()
    .sort((a, b) => a.played_at.localeCompare(b.played_at));

  const earlierDiffs: number[] = [];
  for (const r of allRounds) {
    if (r.played_at < fromIso) {
      if (r.score_differential !== null) {
        earlierDiffs.push(r.score_differential);
      }
    }
  }

  let written = 0;
  const rolling = [...earlierDiffs];
  for (const r of allRounds) {
    if (r.played_at < fromIso) continue;
    if (r.score_differential !== null) {
      rolling.push(r.score_differential);
    }
    const idx = handicapIndex(rolling);
    if (idx === null) continue;
    const snap = createHandicapSnapshot(db, {
      player_id: playerId,
      handicap_index: idx,
      rounds_used_count: Math.min(20, rolling.length),
      triggering_round_id: r.id,
    });
    // Pin calculated_at to the round's played_at so it sorts cleanly.
    db.runSync('UPDATE handicap_snapshots SET calculated_at = ? WHERE id = ?', [
      r.played_at,
      snap.id,
    ]);
    written += 1;
  }

  return { written };
}

/** Recompute from the earliest snapshot for this player (full rebuild). */
export function recomputeAllSnapshots(db: Db, playerId: number): { written: number } {
  const oldest = listSnapshotsForPlayer(db, playerId).slice(-1)[0];
  const fromIso = oldest?.calculated_at ?? '0000-01-01T00:00:00Z';
  return recomputeSnapshotsFromDate(db, playerId, fromIso);
}
