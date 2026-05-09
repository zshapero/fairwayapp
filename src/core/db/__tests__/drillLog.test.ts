import { describe, expect, it } from 'vitest';
import { createTestDb } from './test-helpers';
import { createPlayer } from '../repositories/players';
import {
  countDrillLog,
  hasLoggedRecently,
  listDrillLog,
  logDrill,
} from '../repositories/drillLog';

describe('drill_log repository', () => {
  it('logs a drill and lists it', () => {
    const db = createTestDb();
    const p = createPlayer(db, { name: 'A' });
    const entry = logDrill(db, {
      player_id: p.id,
      recommendation_key: 'three_putt_freq',
    });
    expect(entry.recommendation_key).toBe('three_putt_freq');
    expect(listDrillLog(db, p.id)).toHaveLength(1);
    expect(countDrillLog(db)).toBe(1);
  });

  it('hasLoggedRecently respects the trailing window', () => {
    const db = createTestDb();
    const p = createPlayer(db, { name: 'A' });
    logDrill(db, { player_id: p.id, recommendation_key: 'tempo' });
    expect(hasLoggedRecently(db, p.id, 'tempo', 24)).toBe(true);
    expect(hasLoggedRecently(db, p.id, 'unrelated_key', 24)).toBe(false);
    // Pin the row 50 hours in the past to put it outside a 24h window.
    db.runSync('UPDATE drill_log SET logged_at = ?', [
      new Date(Date.now() - 50 * 3_600_000).toISOString(),
    ]);
    expect(hasLoggedRecently(db, p.id, 'tempo', 24)).toBe(false);
  });
});
