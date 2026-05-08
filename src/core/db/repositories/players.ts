import type { Db } from '../db';
import type { Player } from '../types';

export interface PlayerInput {
  name: string;
  email?: string | null;
  gender?: string | null;
}

const SELECT = 'SELECT id, name, email, gender, created_at, updated_at FROM players';

export function createPlayer(db: Db, input: PlayerInput): Player {
  const now = new Date().toISOString();
  const r = db.runSync(
    'INSERT INTO players (name, email, gender, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [input.name, input.email ?? null, input.gender ?? null, now, now],
  );
  return getPlayer(db, r.lastInsertRowId)!;
}

export function getPlayer(db: Db, id: number): Player | null {
  return db.getFirstSync<Player>(`${SELECT} WHERE id = ?`, [id]);
}

export function listPlayers(db: Db): Player[] {
  return db.getAllSync<Player>(`${SELECT} ORDER BY id`, []);
}

export function updatePlayer(
  db: Db,
  id: number,
  patch: Partial<PlayerInput>,
): Player | null {
  const existing = getPlayer(db, id);
  if (existing === null) return null;
  const next = {
    name: patch.name ?? existing.name,
    email: patch.email !== undefined ? patch.email : existing.email,
    gender: patch.gender !== undefined ? patch.gender : existing.gender,
  };
  db.runSync(
    'UPDATE players SET name = ?, email = ?, gender = ?, updated_at = ? WHERE id = ?',
    [next.name, next.email, next.gender, new Date().toISOString(), id],
  );
  return getPlayer(db, id);
}

export function deletePlayer(db: Db, id: number): void {
  db.runSync('DELETE FROM players WHERE id = ?', [id]);
}

export function countPlayers(db: Db): number {
  const r = db.getFirstSync<{ c: number }>('SELECT COUNT(*) AS c FROM players', []);
  return r?.c ?? 0;
}
