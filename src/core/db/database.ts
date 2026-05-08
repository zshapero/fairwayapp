import * as SQLite from 'expo-sqlite';
import type { Db, RunResult, SqlValue } from './db';
import { runMigrations } from './migrations';
import { DATA_TABLES } from './types';

const DB_NAME = 'fairway.db';

let cached: Db | null = null;

function adaptExpoDb(raw: SQLite.SQLiteDatabase): Db {
  return {
    execSync: (sql) => raw.execSync(sql),
    runSync: (sql, params): RunResult => {
      const r = raw.runSync(sql, params as SqlValue[]);
      return { lastInsertRowId: r.lastInsertRowId, changes: r.changes };
    },
    getAllSync: <T>(sql: string, params: SqlValue[]) =>
      raw.getAllSync<T>(sql, params),
    getFirstSync: <T>(sql: string, params: SqlValue[]) =>
      raw.getFirstSync<T>(sql, params),
  };
}

/**
 * Open (lazily, once) the application database, run migrations, and return
 * the cached singleton wrapped in the portable {@link Db} interface.
 */
export function getDb(): Db {
  if (cached !== null) return cached;
  const raw = SQLite.openDatabaseSync(DB_NAME);
  const db = adaptExpoDb(raw);
  runMigrations(db);
  cached = db;
  return db;
}

/** Test/debug helper: forget the cached handle so the next call re-opens. */
export function _resetDbForTesting(): void {
  cached = null;
}

/** Delete every row from every data table (schema_version is preserved). */
export function clearAllData(db: Db): void {
  db.execSync('PRAGMA foreign_keys = OFF;');
  for (const table of DATA_TABLES) {
    db.runSync(`DELETE FROM ${table}`, []);
    db.runSync(`DELETE FROM sqlite_sequence WHERE name = ?`, [table]);
  }
  db.execSync('PRAGMA foreign_keys = ON;');
}
