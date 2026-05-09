import type { Db } from '../db';
import type { RoundPhoto } from '../types';

export interface RoundPhotoInput {
  id: string;
  round_id: number;
  file_uri: string;
  caption?: string | null;
  taken_at: number;
}

const SELECT =
  'SELECT id, round_id, file_uri, caption, taken_at, created_at FROM round_photos';

export function addPhoto(db: Db, input: RoundPhotoInput): RoundPhoto {
  const now = Date.now();
  db.runSync(
    `INSERT INTO round_photos (id, round_id, file_uri, caption, taken_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.id,
      input.round_id,
      input.file_uri,
      input.caption ?? null,
      input.taken_at,
      now,
    ],
  );
  return db.getFirstSync<RoundPhoto>(`${SELECT} WHERE id = ?`, [input.id])!;
}

export function listPhotosForRound(db: Db, roundId: number): RoundPhoto[] {
  return db.getAllSync<RoundPhoto>(
    `${SELECT} WHERE round_id = ? ORDER BY taken_at ASC, created_at ASC`,
    [roundId],
  );
}

export function getPhoto(db: Db, id: string): RoundPhoto | null {
  return db.getFirstSync<RoundPhoto>(`${SELECT} WHERE id = ?`, [id]);
}

export function removePhoto(db: Db, id: string): void {
  db.runSync('DELETE FROM round_photos WHERE id = ?', [id]);
}

export function updateCaption(
  db: Db,
  id: string,
  caption: string | null,
): RoundPhoto | null {
  db.runSync('UPDATE round_photos SET caption = ? WHERE id = ?', [
    caption === null || caption === '' ? null : caption,
    id,
  ]);
  return getPhoto(db, id);
}

export function countPhotosForRound(db: Db, roundId: number): number {
  const r = db.getFirstSync<{ c: number }>(
    'SELECT COUNT(*) AS c FROM round_photos WHERE round_id = ?',
    [roundId],
  );
  return r?.c ?? 0;
}

/** All photos in DB whose round_id matches — used for cascade-cleanup. */
export function listAllPhotosForRound(db: Db, roundId: number): RoundPhoto[] {
  return listPhotosForRound(db, roundId);
}
