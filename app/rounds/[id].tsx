import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Export } from 'phosphor-react-native';
import { type JSX, useCallback, useEffect, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useToast } from '@/components/Toast';
import { trackEvent } from '@/services/analytics';
import { logError } from '@/services/errorReporting';
import { recomputeSnapshotsFromDate } from '@/services/snapshotRecompute';
import { HandicapMovementCard } from '@/components/round-detail/HandicapMovementCard';
import { HeroHeader } from '@/components/round-detail/HeroHeader';
import { Scorecard } from '@/components/round-detail/Scorecard';
import type { HoleData } from '@/components/round-detail/scorecardData';
import { NotesSection } from '@/components/round-detail/NotesSection';
import { PartialDataBanner } from '@/components/round-detail/PartialDataBanner';
import { RoundActions } from '@/components/round-detail/RoundActions';
import { SummaryRow } from '@/components/round-detail/SummaryRow';
import { getDb } from '@/core/db/database';
import { queryKeys } from '@/core/db/queryClient';
import { listSnapshotsForPlayer } from '@/core/db/repositories/handicapSnapshots';
import { listHoleScoresForRound } from '@/core/db/repositories/holeScores';
import { getCourse } from '@/core/db/repositories/courses';
import { getTee } from '@/core/db/repositories/tees';
import { listTeeHoles } from '@/core/db/repositories/teeHoles';
import {
  deleteRound as deleteRoundRow,
  getRound,
  updateRound,
} from '@/core/db/repositories/rounds';
import { computeMovement } from '@/core/scoring/handicapMovement';
import { CREAM, MUTED_TEXT } from '@/theme/colors';

interface LoadedRound {
  round: NonNullable<ReturnType<typeof getRound>>;
  courseName: string;
  teePillText: string;
  numHolesPlayed: number;
  holes: HoleData[];
  countedAs: number;
  movement: ReturnType<typeof computeMovement>;
}

function loadRound(roundId: number): LoadedRound | null {
  const db = getDb();
  const round = getRound(db, roundId);
  if (round === null) return null;
  const course = getCourse(db, round.course_id);
  const tee = getTee(db, round.tee_id);
  const teeHoles = tee !== null ? listTeeHoles(db, tee.id) : [];
  const holeScores = listHoleScoresForRound(db, round.id);

  const holes: HoleData[] = teeHoles.map((th) => {
    const score = holeScores.find((h) => h.hole_number === th.hole_number);
    return {
      holeNumber: th.hole_number,
      par: th.par,
      yardage: th.yardage,
      strokes: score?.strokes ?? null,
    };
  });

  const courseName =
    course !== null
      ? course.course_name !== null
        ? `${course.club_name} · ${course.course_name}`
        : course.club_name
      : 'Unknown course';
  const teePillText =
    tee !== null
      ? `${tee.tee_name} Tees · ${tee.total_yards ?? '—'}y · ${tee.course_rating.toFixed(1)}/${tee.slope_rating}`
      : '';

  const snapshots = listSnapshotsForPlayer(db, round.player_id);
  const movement = computeMovement(snapshots, round.id, round.played_at);

  return {
    round,
    courseName,
    teePillText,
    numHolesPlayed: round.num_holes_played,
    holes,
    countedAs: round.adjusted_gross_score ?? holes.reduce((s, h) => s + (h.strokes ?? 0), 0),
    movement,
  };
}

export default function RoundDetail(): JSX.Element {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number.parseInt(params.id ?? '', 10);
  const queryClient = useQueryClient();

  // Selection haptic on entry.
  useEffect(() => {
    Haptics.selectionAsync().catch(() => {
      /* haptics may be unavailable — ignore */
    });
  }, []);

  const data = useMemo<LoadedRound | null>(() => {
    if (Number.isNaN(id)) return null;
    return loadRound(id);
  }, [id]);

  const handleSaveNotes = useCallback(
    (next: string) => {
      if (data === null) return;
      updateRound(getDb(), data.round.id, { notes: next.trim() === '' ? null : next });
      queryClient.invalidateQueries({ queryKey: queryKeys.round(data.round.id) });
    },
    [data, queryClient],
  );

  const toast = useToast();

  const handleDelete = useCallback(() => {
    // RoundActions already raises the stern confirmation alert.
    if (data === null) return;
    try {
      const db = getDb();
      const playedAt = data.round.played_at;
      deleteRoundRow(db, data.round.id);
      recomputeSnapshotsFromDate(db, data.round.player_id, playedAt);
      queryClient.invalidateQueries();
      trackEvent('round_deleted', {});
      toast.show('Round deleted');
      router.replace('/');
    } catch (e) {
      logError(e, { scope: 'rounds.delete' });
      trackEvent('error_caught', {
        errorType: e instanceof Error ? e.name : 'unknown',
        screenName: 'round_detail',
      });
      toast.show('Could not delete the round');
    }
  }, [data, queryClient, toast]);

  const handleEdit = useCallback(() => {
    if (data === null) return;
    router.push(`/rounds/${data.round.id}/edit`);
  }, [data]);

  if (data === null) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: CREAM, padding: 24 }}>
        <Text style={{ fontFamily: 'Inter_400Regular', color: MUTED_TEXT }}>
          That round couldn&apos;t be found.
        </Text>
        <Link
          href="/"
          style={{
            fontFamily: 'Inter_500Medium',
            fontSize: 14,
            color: MUTED_TEXT,
            marginTop: 16,
          }}
        >
          ← Back to home
        </Link>
      </SafeAreaView>
    );
  }

  const { round, courseName, teePillText, numHolesPlayed, holes, countedAs, movement } =
    data;
  const hasPerHoleData = holes.some((h) => h.strokes !== null);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: CREAM }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginHorizontal: 20,
          marginTop: 8,
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: 'Inter_500Medium',
            fontSize: 13,
            color: MUTED_TEXT,
          }}
        >
          ← Back
        </Link>
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => {
            Haptics.selectionAsync().catch(() => undefined);
            router.push(`/share/${data.round.id}`);
          }}
        >
          <Export size={20} color={MUTED_TEXT} weight="duotone" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <HeroHeader
          courseName={courseName}
          playedAt={new Date(round.played_at)}
          teePillText={teePillText}
        />

        {!hasPerHoleData ? <PartialDataBanner /> : null}

        <View style={{ paddingHorizontal: 20 }}>
          {/* Summary row */}
          <SummaryRow
            grossScore={round.adjusted_gross_score ?? countedAs}
            countedAs={countedAs}
            courseHandicap={round.course_handicap}
          />

          {/* Scorecard */}
          <View style={{ marginTop: 16 }}>
            <Scorecard holes={holes} nineHoleOnly={numHolesPlayed === 9} />
            {numHolesPlayed === 9 ? (
              <View
                style={{
                  alignSelf: 'flex-start',
                  marginTop: 12,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: 'rgba(15, 23, 42, 0.06)',
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Inter_500Medium',
                    fontSize: 11,
                    color: MUTED_TEXT,
                    letterSpacing: 0.5,
                  }}
                >
                  9-hole round
                </Text>
              </View>
            ) : null}
          </View>

          <View style={{ marginTop: 32 }}>
            <NotesSection initialValue={round.notes} onSave={handleSaveNotes} />
          </View>

          <View style={{ marginTop: 32 }}>
            <HandicapMovementCard
              before={movement.before}
              after={movement.after}
              differential={round.score_differential}
              countedTowardIndex={movement.countedTowardIndex}
            />
          </View>

          <RoundActions onEdit={handleEdit} onDelete={handleDelete} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

