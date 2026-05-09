import { describe, expect, it } from 'vitest';
import type { HandicapSnapshot } from '@/core/db/types';
import { computeMovement } from '../handicapMovement';

function snap(
  id: number,
  calculatedAt: string,
  handicapIndex: number,
  triggering: number | null = null,
): HandicapSnapshot {
  return {
    id,
    player_id: 1,
    calculated_at: calculatedAt,
    handicap_index: handicapIndex,
    rounds_used_count: 8,
    triggering_round_id: triggering,
  };
}

describe('computeMovement', () => {
  const snapshots = [
    snap(1, '2024-04-01T00:00:00Z', 16.0),
    snap(2, '2024-04-15T00:00:00Z', 15.6, 42),
    snap(3, '2024-05-01T00:00:00Z', 15.2),
  ];

  it('reports before/after using the triggering snapshot when present', () => {
    const m = computeMovement(snapshots, 42, '2024-04-15T00:00:00Z');
    expect(m.before).toBe(16.0);
    expect(m.after).toBe(15.6);
    expect(m.countedTowardIndex).toBe(true);
  });

  it('falls back to the next snapshot when no triggering id matches', () => {
    const m = computeMovement(snapshots, 99, '2024-04-15T00:00:00Z');
    expect(m.before).toBe(16.0);
    expect(m.after).toBe(15.6);
    expect(m.countedTowardIndex).toBe(false);
  });

  it('returns null fields when there are no snapshots', () => {
    const m = computeMovement([], 42, '2024-04-15T00:00:00Z');
    expect(m.before).toBeNull();
    expect(m.after).toBeNull();
    expect(m.countedTowardIndex).toBe(false);
  });
});
