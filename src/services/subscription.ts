import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { getDb } from '@/core/db/database';
import { queryKeys } from '@/core/db/queryClient';
import {
  isPremium as isPremiumPlayer,
  listPlayers,
  updatePlayerSubscription,
} from '@/core/db/repositories/players';
import type { Player, SubscriptionTier } from '@/core/db/types';
import type { PremiumFeature } from './subscriptionTypes';

export { PREMIUM_FEATURES, type PremiumFeature } from './subscriptionTypes';

export interface SubscriptionState {
  player: Player | null;
  tier: SubscriptionTier;
  isFree: boolean;
  isPremium: boolean;
  /** True when tier is 'premium' but subscription_expires_at is in the past. */
  isExpired: boolean;
  refresh: () => void;
  hasFeature: (feature: PremiumFeature) => boolean;
}

function readPlayer(): Player | null {
  try {
    const player = listPlayers(getDb())[0];
    return player ?? null;
  } catch (e) {
    // Lazy import to avoid an analytics → subscription → analytics cycle.
    void import('./errorReporting').then((mod) =>
      mod.logError(e, { scope: 'subscription.readPlayer' }),
    );
    return null;
  }
}

function deriveState(player: Player | null): Omit<SubscriptionState, 'refresh' | 'hasFeature'> {
  if (player === null) {
    return {
      player: null,
      tier: 'free',
      isFree: true,
      isPremium: false,
      isExpired: false,
    };
  }
  const premium = isPremiumPlayer(player);
  const expired =
    player.subscription_tier === 'premium' &&
    player.subscription_expires_at !== null &&
    player.subscription_expires_at <= Date.now();
  return {
    player,
    tier: player.subscription_tier,
    isFree: !premium,
    isPremium: premium,
    isExpired: expired,
  };
}

export function useSubscription(): SubscriptionState {
  const queryClient = useQueryClient();
  const { data: player } = useQuery({
    queryKey: ['subscription', 'player'],
    queryFn: () => readPlayer(),
    staleTime: 1000 * 30,
  });
  const state = deriveState(player ?? null);
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['subscription', 'player'] });
    if (player !== null && player !== undefined) {
      queryClient.invalidateQueries({ queryKey: queryKeys.snapshots(player.id) });
    }
  }, [queryClient, player]);
  const hasFeature = useCallback(
    (_feature: PremiumFeature) => state.isPremium,
    [state.isPremium],
  );
  return { ...state, refresh, hasFeature };
}

/**
 * Dev-only escape hatch: flip the seeded player's tier without going
 * through StoreKit. Persists to the actual DB so the change survives a
 * reload. Production (`!__DEV__`) is a no-op so this can never ship.
 */
export function setMockSubscriptionTier(tier: SubscriptionTier): void {
  if (typeof __DEV__ !== 'undefined' && __DEV__ === false) return;
  const player = readPlayer();
  if (player === null) return;
  updatePlayerSubscription(getDb(), player.id, {
    subscription_tier: tier,
    subscription_started_at: tier === 'premium' ? Date.now() : null,
    subscription_expires_at:
      tier === 'premium' ? Date.now() + 30 * 86_400_000 : null,
  });
}
