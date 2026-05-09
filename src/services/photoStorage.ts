import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { addPhoto, listPhotosForRound, removePhoto } from '@/core/db/repositories/roundPhotos';
import { getDb } from '@/core/db/database';
import { logError } from './errorReporting';

/** Limit per round, matches the spec. */
export const MAX_PHOTOS_PER_ROUND = 3;

/** Lightweight RFC4122-ish v4 generator — good enough for a local id namespace. */
export function generatePhotoId(): string {
  const r = (n: number): string =>
    Array.from({ length: n }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join('');
  return `${r(8)}-${r(4)}-4${r(3)}-${(8 + Math.floor(Math.random() * 4)).toString(16)}${r(3)}-${r(12)}`;
}

/** Directory used for a round's photos under documentDirectory. */
export function photoDirForRound(roundId: number): string {
  return `${FileSystem.documentDirectory ?? ''}photos/${roundId}/`;
}

async function ensureDir(uri: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(uri, { intermediates: true });
  }
}

export type PhotoSourceKind = 'library' | 'camera';

interface PickResult {
  uri: string;
  takenAt: number;
}

async function pickFromLibrary(): Promise<PickResult | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (perm.status !== 'granted') return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.85,
    exif: false,
  });
  if (result.canceled || result.assets.length === 0) return null;
  return { uri: result.assets[0].uri, takenAt: Date.now() };
}

async function pickFromCamera(): Promise<PickResult | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (perm.status !== 'granted') return null;
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.85,
    exif: false,
  });
  if (result.canceled || result.assets.length === 0) return null;
  return { uri: result.assets[0].uri, takenAt: Date.now() };
}

export interface AttachPhotoResult {
  success: boolean;
  /** Reason when success is false. */
  reason?:
    | 'limit-reached'
    | 'cancelled'
    | 'permission-denied'
    | 'copy-failed';
}

/**
 * Pick a photo from the requested source, copy it into the round's photo
 * directory, and record it in the DB. Caller owns the round-existence
 * check.  Returns a structured result rather than throwing so callers can
 * show appropriate UI per failure mode.
 */
export async function attachPhotoFromSource(
  roundId: number,
  source: PhotoSourceKind,
): Promise<AttachPhotoResult> {
  const db = getDb();
  if (listPhotosForRound(db, roundId).length >= MAX_PHOTOS_PER_ROUND) {
    return { success: false, reason: 'limit-reached' };
  }
  const picked = source === 'library' ? await pickFromLibrary() : await pickFromCamera();
  if (picked === null) {
    return { success: false, reason: 'cancelled' };
  }
  try {
    const dir = photoDirForRound(roundId);
    await ensureDir(dir);
    const id = generatePhotoId();
    const dest = `${dir}${id}.jpg`;
    await FileSystem.copyAsync({ from: picked.uri, to: dest });
    addPhoto(db, {
      id,
      round_id: roundId,
      file_uri: dest,
      taken_at: picked.takenAt,
    });
    return { success: true };
  } catch (e) {
    logError(e, { scope: 'photoStorage.attach', extra: { roundId, source } });
    return { success: false, reason: 'copy-failed' };
  }
}

/** Delete a photo's underlying file (best effort) and DB row. */
export async function deletePhoto(photoId: string, fileUri: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(fileUri, { idempotent: true });
  } catch (e) {
    logError(e, { scope: 'photoStorage.deleteFile', extra: { photoId, fileUri } });
  }
  removePhoto(getDb(), photoId);
}

/** Remove the on-disk photo directory for a round (used in cascade-cleanup). */
export async function deletePhotoDirForRound(roundId: number): Promise<void> {
  const dir = photoDirForRound(roundId);
  try {
    const info = await FileSystem.getInfoAsync(dir);
    if (info.exists) {
      await FileSystem.deleteAsync(dir, { idempotent: true });
    }
  } catch (e) {
    logError(e, { scope: 'photoStorage.deleteDir', extra: { roundId } });
  }
}
