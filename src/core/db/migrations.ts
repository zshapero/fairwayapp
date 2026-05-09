import type { Db } from './db';
import { SCHEMA_SQL, SCHEMA_VERSION } from './schema';

/** Add a column to a table if it doesn't already exist (SQLite-safe). */
function ensureColumn(
  db: Db,
  table: string,
  column: string,
  ddl: string,
): void {
  const cols = db.getAllSync<{ name: string }>(
    `PRAGMA table_info(${table})`,
    [],
  );
  if (cols.some((c) => c.name === column)) return;
  db.execSync(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
}

/**
 * Bring a database up to the current {@link SCHEMA_VERSION}. Idempotent:
 * may be called on every app start. Also enforces additive column
 * migrations that can't be expressed in CREATE TABLE IF NOT EXISTS.
 */
export function runMigrations(db: Db): void {
  db.execSync('PRAGMA foreign_keys = ON;');
  db.execSync(SCHEMA_SQL);

  // Additive column migrations introduced in v2: subscription + preferences
  // fields on players. Safe to run on every start.
  ensureColumn(
    db,
    'players',
    'subscription_tier',
    "subscription_tier TEXT NOT NULL DEFAULT 'free'",
  );
  ensureColumn(
    db,
    'players',
    'subscription_started_at',
    'subscription_started_at INTEGER',
  );
  ensureColumn(
    db,
    'players',
    'subscription_expires_at',
    'subscription_expires_at INTEGER',
  );
  ensureColumn(
    db,
    'players',
    'preferred_units',
    "preferred_units TEXT NOT NULL DEFAULT 'imperial'",
  );
  ensureColumn(
    db,
    'players',
    'time_format',
    "time_format TEXT NOT NULL DEFAULT '12h'",
  );
  ensureColumn(
    db,
    'players',
    'preferred_tee_id',
    'preferred_tee_id INTEGER',
  );
  ensureColumn(
    db,
    'players',
    'onboarded',
    'onboarded INTEGER NOT NULL DEFAULT 0',
  );
  ensureColumn(
    db,
    'players',
    'home_course_id',
    'home_course_id INTEGER',
  );

  const current = db.getFirstSync<{ version: number }>(
    'SELECT version FROM schema_version LIMIT 1',
    [],
  );
  if (current === null) {
    db.runSync('INSERT INTO schema_version (version) VALUES (?)', [SCHEMA_VERSION]);
    return;
  }
  if (current.version !== SCHEMA_VERSION) {
    db.runSync('UPDATE schema_version SET version = ?', [SCHEMA_VERSION]);
  }
}

export function getSchemaVersion(db: Db): number {
  const row = db.getFirstSync<{ version: number }>(
    'SELECT version FROM schema_version LIMIT 1',
    [],
  );
  return row?.version ?? 0;
}
