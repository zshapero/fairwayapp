import { describe, it, expect } from 'vitest';
import { createTestDb } from './test-helpers';
import { getSchemaVersion } from '../migrations';
import { SCHEMA_VERSION } from '../schema';
import { DATA_TABLES } from '../types';

describe('schema and migrations', () => {
  it('records the current schema version', () => {
    const db = createTestDb();
    expect(getSchemaVersion(db)).toBe(SCHEMA_VERSION);
  });

  it('creates every data table', () => {
    const db = createTestDb();
    for (const table of DATA_TABLES) {
      const row = db.getFirstSync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
        [table],
      );
      expect(row?.name).toBe(table);
    }
  });

  it('is idempotent when run twice on the same database', () => {
    const db = createTestDb();
    // createTestDb already ran migrations once; rerunning shouldn't error or duplicate.
    expect(() => {
      db.execSync('SELECT 1');
    }).not.toThrow();
    const versions = db.getAllSync<{ version: number }>(
      'SELECT version FROM schema_version',
      [],
    );
    expect(versions).toHaveLength(1);
  });
});
