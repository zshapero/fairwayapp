import type { Db } from '../db';

const MAX_RECENT = 5;

export interface RecentSearch {
  id: number;
  query: string;
  searched_at: string;
}

/** Record a search query, deduplicating and capping the list at 5 (FIFO). */
export function recordSearch(db: Db, query: string): void {
  const trimmed = query.trim();
  if (trimmed === '') return;
  // Remove any existing copy first so the new entry sits at the top.
  db.runSync('DELETE FROM recent_searches WHERE query = ?', [trimmed]);
  db.runSync(
    'INSERT INTO recent_searches (query, searched_at) VALUES (?, ?)',
    [trimmed, new Date().toISOString()],
  );
  // Trim to MAX_RECENT entries.
  const all = db.getAllSync<RecentSearch>(
    'SELECT id, query, searched_at FROM recent_searches ORDER BY searched_at DESC, id DESC',
    [],
  );
  if (all.length > MAX_RECENT) {
    const stale = all.slice(MAX_RECENT).map((r) => r.id);
    db.runSync(
      `DELETE FROM recent_searches WHERE id IN (${stale.map(() => '?').join(',')})`,
      stale,
    );
  }
}

export function listRecentSearches(db: Db): RecentSearch[] {
  return db.getAllSync<RecentSearch>(
    `SELECT id, query, searched_at FROM recent_searches
       ORDER BY searched_at DESC, id DESC LIMIT ${MAX_RECENT}`,
    [],
  );
}

export function clearRecentSearches(db: Db): void {
  db.runSync('DELETE FROM recent_searches', []);
}
