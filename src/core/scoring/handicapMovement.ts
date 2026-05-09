import type { HandicapSnapshot } from '@/core/db/types';

export interface HandicapMovement {
  before: number | null;
  after: number | null;
  countedTowardIndex: boolean;
}

/**
 * Given a chronological snapshot history and the round whose impact we
 * want to surface, return the index value before and after that round.
 *
 * The "before" snapshot is the latest one calculated strictly before the
 * round; "after" is the snapshot whose triggering_round_id matches (or, if
 * none, the earliest snapshot calculated after the round).
 */
export function computeMovement(
  snapshots: HandicapSnapshot[],
  roundId: number,
  roundPlayedAt: string,
): HandicapMovement {
  const ordered = [...snapshots].sort((a, b) =>
    a.calculated_at.localeCompare(b.calculated_at),
  );
  const playedTs = roundPlayedAt;
  const before = [...ordered]
    .reverse()
    .find((s) => s.calculated_at < playedTs);
  const triggered = ordered.find((s) => s.triggering_round_id === roundId);
  const after = triggered ?? ordered.find((s) => s.calculated_at >= playedTs);
  return {
    before: before?.handicap_index ?? null,
    after: after?.handicap_index ?? null,
    countedTowardIndex: triggered !== undefined,
  };
}
