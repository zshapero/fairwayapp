import type { Db } from '../db';
import type {
  Player,
  PreferredUnits,
  SubscriptionTier,
  TimeFormat,
} from '../types';

export interface PlayerInput {
  name: string;
  email?: string | null;
  gender?: string | null;
}

const SELECT = `SELECT
  id, name, email, gender, created_at, updated_at,
  subscription_tier, subscription_started_at, subscription_expires_at,
  preferred_units, time_format, preferred_tee_id,
  onboarded, home_course_id
FROM players`;

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

export interface PlayerPreferencePatch {
  preferred_units?: PreferredUnits;
  time_format?: TimeFormat;
  preferred_tee_id?: number | null;
}

export function updatePlayerPreferences(
  db: Db,
  id: number,
  patch: PlayerPreferencePatch,
): Player | null {
  const existing = getPlayer(db, id);
  if (existing === null) return null;
  const next = { ...existing, ...patch };
  db.runSync(
    `UPDATE players
       SET preferred_units = ?, time_format = ?, preferred_tee_id = ?, updated_at = ?
     WHERE id = ?`,
    [
      next.preferred_units,
      next.time_format,
      next.preferred_tee_id,
      new Date().toISOString(),
      id,
    ],
  );
  return getPlayer(db, id);
}

export interface SubscriptionPatch {
  subscription_tier: SubscriptionTier;
  subscription_started_at?: number | null;
  subscription_expires_at?: number | null;
}

export function updatePlayerSubscription(
  db: Db,
  id: number,
  patch: SubscriptionPatch,
): Player | null {
  const existing = getPlayer(db, id);
  if (existing === null) return null;
  db.runSync(
    `UPDATE players
       SET subscription_tier = ?,
           subscription_started_at = ?,
           subscription_expires_at = ?,
           updated_at = ?
     WHERE id = ?`,
    [
      patch.subscription_tier,
      patch.subscription_started_at ?? null,
      patch.subscription_expires_at ?? null,
      new Date().toISOString(),
      id,
    ],
  );
  return getPlayer(db, id);
}

export function setOnboardingComplete(
  db: Db,
  id: number,
  homeCourseId: number | null,
): Player | null {
  const existing = getPlayer(db, id);
  if (existing === null) return null;
  db.runSync(
    'UPDATE players SET onboarded = 1, home_course_id = ?, updated_at = ? WHERE id = ?',
    [homeCourseId, new Date().toISOString(), id],
  );
  return getPlayer(db, id);
}

export function setHomeCourse(
  db: Db,
  id: number,
  courseId: number | null,
): Player | null {
  const existing = getPlayer(db, id);
  if (existing === null) return null;
  db.runSync(
    'UPDATE players SET home_course_id = ?, updated_at = ? WHERE id = ?',
    [courseId, new Date().toISOString(), id],
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

/**
 * Premium when the tier flag is 'premium' AND the expiration is either
 * absent (lifetime) or strictly in the future relative to {@link now}.
 */
export function isPremium(player: Player, now: Date = new Date()): boolean {
  if (player.subscription_tier !== 'premium') return false;
  if (player.subscription_expires_at === null) return true;
  return player.subscription_expires_at > now.getTime();
}
