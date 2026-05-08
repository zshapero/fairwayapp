import BetterSqlite3 from 'better-sqlite3';
import type { Db, RunResult, SqlValue } from '../db';
import { runMigrations } from '../migrations';

/**
 * Create an in-memory better-sqlite3 database wrapped as the portable
 * {@link Db} interface, with the application schema already applied.
 */
export function createTestDb(): Db {
  const raw = new BetterSqlite3(':memory:');
  raw.pragma('foreign_keys = ON');
  const db: Db = {
    execSync: (sql) => {
      raw.exec(sql);
    },
    runSync: (sql, params): RunResult => {
      const r = raw.prepare(sql).run(...(params as SqlValue[]));
      return { lastInsertRowId: Number(r.lastInsertRowid), changes: r.changes };
    },
    getAllSync: <T>(sql: string, params: SqlValue[]) =>
      raw.prepare(sql).all(...params) as T[],
    getFirstSync: <T>(sql: string, params: SqlValue[]) =>
      (raw.prepare(sql).get(...params) ?? null) as T | null,
  };
  runMigrations(db);
  return db;
}
