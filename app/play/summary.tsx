import * as Haptics from 'expo-haptics';
import { Link, router } from 'expo-router';
import { type JSX, useMemo } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDb } from '@/core/db/database';
import { getCourse } from '@/core/db/repositories/courses';
import { listPlayers } from '@/core/db/repositories/players';
import { listRoundsForPlayer } from '@/core/db/repositories/rounds';
import { getTee } from '@/core/db/repositories/tees';
import { listTeeHoles } from '@/core/db/repositories/teeHoles';
import { PhotosSection } from '@/components/round-detail/PhotosSection';
import { calculateExpectedScore } from '@/core/handicap';
import { trackEvent } from '@/services/analytics';
import { fetchAndStoreWeatherForRound } from '@/services/weather';
import { ACCENT_GOLD, CREAM, MASTERS_GREEN, MUTED_TEXT } from '@/theme/colors';

interface SummaryData {
  round: NonNullable<ReturnType<typeof listRoundsForPlayer>[0]>;
  expected: number;
  actual: number;
  parTotal: number;
  courseLat: number | null;
  courseLng: number | null;
}

function loadSummary(): SummaryData | null {
  const db = getDb();
  const player = listPlayers(db)[0];
  if (player === undefined) return null;
  const round = listRoundsForPlayer(db, player.id)[0];
  if (round === undefined) return null;
  const course = getCourse(db, round.course_id);
  const tee = getTee(db, round.tee_id);
  const teeHoles = tee !== null ? listTeeHoles(db, tee.id) : [];
  const parTotal =
    teeHoles.length > 0 ? teeHoles.reduce((s, h) => s + h.par, 0) : 72;
  // Approximate the player's index from their course handicap on file.
  const indexEstimate =
    tee !== null
      ? (round.course_handicap - (tee.course_rating - parTotal)) *
        (113 / tee.slope_rating)
      : round.course_handicap;
  const expected = calculateExpectedScore(
    indexEstimate,
    tee?.course_rating ?? 72,
    tee?.slope_rating ?? 113,
    parTotal,
    {
      temperatureF: round.temperature_f,
      windSpeedMph: round.wind_speed_mph,
      condition: round.weather_condition,
    },
  );
  return {
    round,
    expected,
    actual: round.adjusted_gross_score ?? 0,
    parTotal,
    courseLat: course?.latitude ?? null,
    courseLng: course?.longitude ?? null,
  };
}

/**
 * Placeholder round-summary route. The full round-entry flow lives in a
 * future PR — this stub exists so the share trigger has somewhere to live
 * and the expected-vs-actual line has somewhere to render. Save fires a
 * fire-and-forget weather fetch, then routes home.
 */
export default function PlaySummary(): JSX.Element {
  const summary = useMemo(() => loadSummary(), []);
  const round = summary?.round ?? null;

  const expectedLine = ((): string | null => {
    if (summary === null) return null;
    const delta = summary.actual - summary.expected;
    if (delta === 0) {
      return `You shot ${summary.actual}. Right at expectations for the conditions.`;
    }
    const word = delta < 0 ? 'better' : 'worse';
    const n = Math.abs(delta);
    return `You shot ${summary.actual}. Expected ${summary.expected} in those conditions. ${n} stroke${n === 1 ? '' : 's'} ${word}.`;
  })();

  const onSave = (): void => {
    if (round !== null) {
      trackEvent('round_saved', {
        numHolesPlayed: round.num_holes_played,
        grossScore: round.adjusted_gross_score ?? 0,
        scoreDifferential: round.score_differential,
      });
      // Fire-and-forget weather fetch when we have coordinates.
      if (summary?.courseLat !== null && summary?.courseLng !== null) {
        fetchAndStoreWeatherForRound(
          round.id,
          summary!.courseLat!,
          summary!.courseLng!,
          round.played_at,
        );
      }
    }
    router.push('/');
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: CREAM }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        <Link
          href="/"
          style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: MUTED_TEXT }}
        >
          ← Home
        </Link>

        <Text
          style={{
            fontFamily: 'Fraunces_700Bold',
            fontSize: 32,
            color: '#0F172A',
            marginTop: 24,
          }}
        >
          Round saved
        </Text>
        {expectedLine !== null ? (
          <View style={{ marginTop: 14 }}>
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 11,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: ACCENT_GOLD,
              }}
            >
              How you did
            </Text>
            <Text
              style={{
                fontFamily: 'Fraunces_500Medium',
                fontSize: 18,
                lineHeight: 26,
                color: '#0F172A',
                marginTop: 6,
              }}
            >
              {expectedLine}
            </Text>
          </View>
        ) : (
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 14,
              color: MUTED_TEXT,
              marginTop: 6,
            }}
          >
            Round entry flow lands in a future PR — this is the share trigger surface.
          </Text>
        )}

        {round !== null ? (
          <View style={{ marginTop: 28 }}>
            <PhotosSection roundId={round.id} />
          </View>
        ) : null}

        <View style={{ marginTop: 32, gap: 12 }}>
          <Pressable
            accessibilityRole="button"
            onPress={onSave}
            style={({ pressed }) => ({
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: 'center',
              backgroundColor: MASTERS_GREEN,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text
              style={{ fontFamily: 'Inter_500Medium', fontSize: 15, color: 'white' }}
            >
              Save
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              Alert.alert('Discard round?', 'This will not be persisted.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Discard',
                  style: 'destructive',
                  onPress: () => router.replace('/'),
                },
              ])
            }
            style={({ pressed }) => ({
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(15, 23, 42, 0.12)',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={{ fontFamily: 'Inter_500Medium', fontSize: 15, color: '#0F172A' }}
            >
              Discard
            </Text>
          </Pressable>
          {round !== null ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                Haptics.selectionAsync().catch(() => undefined);
                router.push(`/share/${round.id}`);
              }}
              style={({ pressed }) => ({
                paddingVertical: 14,
                alignItems: 'center',
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text
                style={{
                  fontFamily: 'Inter_500Medium',
                  fontSize: 14,
                  color: MASTERS_GREEN,
                }}
              >
                Share this round
              </Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
