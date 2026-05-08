import { describe, it, expect } from 'vitest';
import { createTestDb } from './test-helpers';
import {
  countPlayers,
  createPlayer,
  deletePlayer,
  getPlayer,
  listPlayers,
  updatePlayer,
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

  it('deletes a player', () => {
    const db = createTestDb();
    const p = createPlayer(db, { name: 'Alice' });
    deletePlayer(db, p.id);
    expect(getPlayer(db, p.id)).toBeNull();
    expect(countPlayers(db)).toBe(0);
  });
});
