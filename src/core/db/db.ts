/**
 * Minimal synchronous SQLite interface used throughout the database layer.
 * Both expo-sqlite (in the app) and better-sqlite3 (in tests) implement
 * adapters to this shape so repository code is portable across them.
 */
export type SqlValue = string | number | null;

export interface RunResult {
  lastInsertRowId: number;
  changes: number;
}

export interface Db {
  execSync(sql: string): void;
  runSync(sql: string, params: SqlValue[]): RunResult;
  getAllSync<T>(sql: string, params: SqlValue[]): T[];
  getFirstSync<T>(sql: string, params: SqlValue[]): T | null;
}
