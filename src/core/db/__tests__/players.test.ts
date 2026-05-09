import { describe, it, expect } from 'vitest';
import { createTestDb } from './test-helpers';
import {
  countPlayers,
  createPlayer,
  deletePlayer,
  getPlayer,
  isPremium,
  listPlayers,
  updatePlayer,
  updatePlayerPreferences,
  updatePlayerSubscription,
} from '../repositories/players';

describe('players repository', () => {
  it('creates and retrieves a player', () => {
    const db = createTestDb();
    const created = createPlayer(db, { name: 'Alice', email: 'a@example.com' });
    expect(created.id).toBeGreaterThan(0);
    expect(created.name).toBe('Alice');
    expect(getPlayer(db, created.id)?.email).toBe('a@example.com');
  });

  it('lists all players in id order', () => {
    const db = createTestDb();
    createPlayer(db, { name: 'A' });
    createPlayer(db, { name: 'B' });
    const names = listPlayers(db).map((p) => p.name);
    expect(names).toEqual(['A', 'B']);
  });

  it('updates a player and bumps updated_at', () => {
    const db = createTestDb();
    const p = createPlayer(db, { name: 'Old' });
    const updated = updatePlayer(db, p.id, { name: 'New' });
    expect(updated?.name).toBe('New');
  });

  it('returns null when updating a missing player', () => {
    const db = createTestDb();
    expect(updatePlayer(db, 999, { name: 'x' })).toBeNull();
  });

  it('defaults new players to free tier and imperial / 12h preferences', () => {
    const db = createTestDb();
    const p = createPlayer(db, { name: 'A' });
    expect(p.subscription_tier).toBe('free');
    expect(p.preferred_units).toBe('imperial');
    expect(p.time_format).toBe('12h');
    expect(p.preferred_tee_id).toBeNull();
  });

  it('persists subscription tier, start, and expiration', () => {
    const db = createTestDb();
    const p = createPlayer(db, { name: 'A' });
    const now = Date.now();
    const updated = updatePlayerSubscription(db, p.id, {
      subscription_tier: 'premium',
      subscription_started_at: now,
      subscription_expires_at: now + 30 * 86_400_000,
    });
    expect(updated?.subscription_tier).toBe('premium');
    expect(updated?.subscription_started_at).toBe(now);
    expect(updated?.subscription_expires_at).toBe(now + 30 * 86_400_000);
  });

  it('isPremium honors expiration', () => {
    const db = createTestDb();
    const p = createPlayer(db, { name: 'A' });
    expect(isPremium(p)).toBe(false);
    const future = updatePlayerSubscription(db, p.id, {
      subscription_tier: 'premium',
      subscription_expires_at: Date.now() + 86_400_000,
    });
    expect(isPremium(future!)).toBe(true);
    const expired = updatePlayerSubscription(db, p.id, {
      subscription_tier: 'premium',
      subscription_expires_at: Date.now() - 86_400_000,
    });
    expect(isPremium(expired!)).toBe(false);
    const lifetime = updatePlayerSubscription(db, p.id, {
      subscription_tier: 'premium',
      subscription_expires_at: null,
    });
    expect(isPremium(lifetime!)).toBe(true);
  });

  it('persists preferences via updatePlayerPreferences', () => {
    const db = createTestDb();
    const p = createPlayer(db, { name: 'A' });
    const updated = updatePlayerPreferences(db, p.id, {
      preferred_units: 'metric',
      time_format: '24h',
      preferred_tee_id: null,
    });
    expect(updated?.preferred_units).toBe('metric');
    expect(updated?.time_format).toBe('24h');
  });

  it('deletes a player', () => {
    const db = createTestDb();
    const p = createPlayer(db, { name: 'Alice' });
    deletePlayer(db, p.id);
    expect(getPlayer(db, p.id)).toBeNull();
    expect(countPlayers(db)).toBe(0);
  });
});
