import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { getDb } from '@/core/db/database';
import { getCourse } from '@/core/db/repositories/courses';
import { listHoleScoresForRound } from '@/core/db/repositories/holeScores';
import { listPhotosForRound } from '@/core/db/repositories/roundPhotos';
import { getRound, listRoundsForPlayer } from '@/core/db/repositories/rounds';
import { getTee } from '@/core/db/repositories/tees';
import { listTeeHoles } from '@/core/db/repositories/teeHoles';
import {
  selectHighlight,
  totalPar,
  type HighlightHole,
} from '@/core/scoring/highlight';
import type { ShareableRoundCardProps } from '@/components/ShareableRoundCard';

/**
 * Compose the props the {@link ShareableRoundCard} needs from a stored
 * round id.  Returns null if the round (or its course / tee) can't be
 * loaded.
 */
export function buildShareData(roundId: number): ShareableRoundCardProps | null {
  const db = getDb();
  const round = getRound(db, roundId);
  if (round === null) return null;
  const course = getCourse(db, round.course_id);
  const tee = getTee(db, round.tee_id);
  const teeHoles = tee !== null ? listTeeHoles(db, tee.id) : [];
  const holeScores = listHoleScoresForRound(db, round.id);

  const highlightHoles: HighlightHole[] = teeHoles.map((th) => {
    const score = holeScores.find((h) => h.hole_number === th.hole_number);
    return {
      holeNumber: th.hole_number,
      par: th.par,
      strokes: score?.strokes ?? null,
      strokeIndex: th.stroke_index,
    };
  });

  const fairwaysHit = holeScores.reduce(
    (sum, h) => sum + (h.fairway_hit === 1 ? 1 : 0),
    0,
  );
  const fairwaysAttempted = holeScores.filter(
    (h) => h.fairway_hit !== null && h.par !== 3,
  ).length;
  const greensInRegulation = holeScores.reduce(
    (sum, h) => sum + (h.green_in_regulation === 1 ? 1 : 0),
    0,
  );
  const totalGreensAvailable = holeScores.filter(
    (h) => h.green_in_regulation !== null,
  ).length;
  const putts = holeScores.reduce((sum, h) => sum + (h.putts ?? 0), 0);
  const hasPutts = holeScores.some((h) => h.putts !== null);

  // Previous best gross score for this player (for milestone detection).
  const otherRounds = listRoundsForPlayer(db, round.player_id).filter(
    (r) => r.id !== round.id && r.adjusted_gross_score !== null && r.num_holes_played === 18,
  );
  const previousBest =
    otherRounds.length > 0
      ? Math.min(
          ...otherRounds
            .map((r) => r.adjusted_gross_score)
            .filter((v): v is number => v !== null),
        )
      : null;

  const grossScore =
    round.adjusted_gross_score ??
    holeScores.reduce((s, h) => s + h.strokes, 0);
  const parTotal =
    teeHoles.length > 0 ? totalPar(highlightHoles) : grossScore - 0;

  const highlight = selectHighlight({
    holes: highlightHoles,
    grossScore,
    previousBest,
    nineHole: round.num_holes_played === 9,
  });

  const courseName =
    course !== null
      ? course.course_name !== null
        ? `${course.club_name} · ${course.course_name}`
        : course.club_name
      : 'Unknown course';
  const teeLabel =
    tee !== null
      ? `${tee.tee_name} Tees · ${tee.total_yards ?? '—'}y`
      : 'Tees';
  const dateLabel = formatLongDate(new Date(round.played_at));
  const photos = listPhotosForRound(db, round.id);
  const defaultPhotoUri =
    photos.length > 0 ? photos[photos.length - 1].file_uri : null;

  return {
    courseName,
    teeLabel: teeLabel.toUpperCase(),
    dateLabel,
    grossScore,
    parTotal,
    fairwaysHit,
    fairwaysAttempted: fairwaysAttempted === 0 ? null : fairwaysAttempted,
    greensInRegulation,
    totalGreensAvailable: totalGreensAvailable === 0 ? null : totalGreensAvailable,
    putts: hasPutts ? putts : null,
    highlight,
    nineHole: round.num_holes_played === 9,
    backgroundPhotoUri: defaultPhotoUri,
  };
}

/**
 * Public read of a round's photos as URI strings — used by the share
 * preview screen when it needs to show the "use which photo as background?"
 * thumbnail row.
 */
export function listShareablePhotoUris(roundId: number): string[] {
  return listPhotosForRound(getDb(), roundId).map((p) => p.file_uri);
}

const MONTHS_LONG = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function formatLongDate(date: Date): string {
  return `${MONTHS_LONG[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

interface CaptureOptions {
  /** Final pixel width of the PNG. Defaults to 1080. */
  width?: number;
  /** Final pixel height. Defaults to 1350. */
  height?: number;
}

async function captureCardToFile(
  ref: RefObject<View | null>,
  options: CaptureOptions = {},
): Promise<string> {
  if (ref.current === null) {
    throw new Error('Share card ref is not attached.');
  }
  const uri = await captureRef(ref, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
    width: options.width ?? 1080,
    height: options.height ?? 1350,
  });
  return uri;
}

/** Capture the card and present the native share sheet. */
export async function captureAndShare(
  ref: RefObject<View | null>,
): Promise<{ shared: boolean }> {
  const uri = await captureCardToFile(ref);
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    await safeDelete(uri);
    return { shared: false };
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'image/png',
    dialogTitle: 'Share this round',
    UTI: 'public.png',
  });
  // Best-effort cleanup. Some platforms complete sharing before we get here;
  // others continue to read the file briefly. Either way, removing later is fine.
  setTimeout(() => {
    void safeDelete(uri);
  }, 5000);
  return { shared: true };
}

/** Capture the card and write it to the user's camera roll. */
export async function captureAndSaveToPhotos(
  ref: RefObject<View | null>,
): Promise<{ saved: boolean; reason?: string }> {
  const permission = await MediaLibrary.requestPermissionsAsync();
  if (permission.status !== 'granted') {
    return { saved: false, reason: 'permission-denied' };
  }
  const uri = await captureCardToFile(ref);
  try {
    await MediaLibrary.saveToLibraryAsync(uri);
    return { saved: true };
  } finally {
    await safeDelete(uri);
  }
}

async function safeDelete(uri: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Ignore — file may already be cleaned up by the share sheet.
  }
}
