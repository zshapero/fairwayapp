import type { Db } from './db';
import { SCHEMA_SQL, SCHEMA_VERSION } from './schema';

/**
 * Bring a database up to the current {@link SCHEMA_VERSION}. Idempotent:
 * may be called on every app start.
 */
export function runMigrations(db: Db): void {
  db.execSync('PRAGMA foreign_keys = ON;');
  db.execSync(SCHEMA_SQL);
  const current = db.getFirstSync<{ version: number }>(
    'SELECT version FROM schema_version LIMIT 1',
    [],
  );
  if (current === null) {
    db.runSync('INSERT INTO schema_version (version) VALUES (?)', [SCHEMA_VERSION]);
    return;
  }
  if (current.version !== SCHEMA_VERSION) {
    // Future migrations from current.version → SCHEMA_VERSION go here.
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
