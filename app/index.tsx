import * as Haptics from 'expo-haptics';
import { Link, router, useFocusEffect } from 'expo-router';
import { CalendarBlank, GearSix } from 'phosphor-react-native';
import { type JSX, useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '@/components/GlassCard';
import { useRefresh } from '@/components/PullToRefresh';
import { HandicapTrendChart } from '@/components/HandicapTrendChart';
import type { SnapshotPoint } from '@/components/HandicapTrendChart';
import { generateDemoTrend } from '@/components/home/demoTrend';
import { RoundsLately } from '@/components/home/RoundsLately';
import type { RoundCardData } from '@/components/home/RoundCard';
import { getDb } from '@/core/db/database';
import { getCourse } from '@/core/db/repositories/courses';
import { getSnapshotsForPlayer } from '@/core/db/repositories/handicapSnapshots';
import { listPlayers } from '@/core/db/repositories/players';
import { listRoundsForPlayer } from '@/core/db/repositories/rounds';
import { listTeeHoles } from '@/core/db/repositories/teeHoles';
import { ACCENT_GOLD, MASTERS_GREEN, MUTED_TEXT } from '@/theme/colors';

const HOUR_GREETINGS: { from: number; text: string }[] = [
  { from: 0, text: 'Good evening' },
  { from: 5, text: 'Good morning' },
  { from: 12, text: 'Good afternoon' },
  { from: 18, text: 'Good evening' },
];

function greetingForHour(hour: number): string {
  let pick = HOUR_GREETINGS[0];
  for (const slot of HOUR_GREETINGS) {
    if (hour >= slot.from) pick = slot;
  }
  return pick.text;
}

interface HomeData {
  snapshots: SnapshotPoint[];
  rounds: RoundCardData[];
  latestIndex: number | null;
  priorIndex: number | null;
  homeCourseLabel: string | null;
  homeCourseId: number | null;
  hasPlayedHomeCourse: boolean;
}

function loadHome(): HomeData {
  const db = getDb();
  const player = listPlayers(db)[0];
  if (player === undefined) {
    const fallback = generateDemoTrend();
    return {
      snapshots: fallback,
      rounds: [],
      latestIndex: fallback[fallback.length - 1]?.index ?? null,
      priorIndex: fallback[fallback.length - 2]?.index ?? null,
      homeCourseLabel: null,
      homeCourseId: null,
      hasPlayedHomeCourse: false,
    };
  }
  const snaps = getSnapshotsForPlayer(db, player.id);
  const snapshots: SnapshotPoint[] = snaps.map((s) => ({
    date: new Date(s.calculated_at),
    index: s.handicap_index,
  }));
  const rounds: RoundCardData[] = listRoundsForPlayer(db, player.id)
    .slice(0, 5)
    .map((r) => {
      const course = getCourse(db, r.course_id);
      const teeHoles = listTeeHoles(db, r.tee_id);
      const parTotal = teeHoles.reduce((s, th) => s + th.par, 0);
      const courseLabel =
        course !== null
          ? course.course_name !== null
            ? `${course.club_name}`
            : course.club_name
          : 'Unknown course';
      return {
        id: r.id,
        courseName: courseLabel,
        playedAt: new Date(r.played_at),
        grossScore: r.adjusted_gross_score ?? 0,
        parTotal: parTotal === 0 ? 72 : parTotal,
      };
    });
  // Fall back to demo trend when seeding failed entirely.
  const trend = snapshots.length >= 3 ? snapshots : generateDemoTrend();
  let homeCourseLabel: string | null = null;
  let hasPlayedHomeCourse = false;
  if (player.home_course_id !== null) {
    const home = getCourse(db, player.home_course_id);
    if (home !== null) {
      homeCourseLabel = home.club_name;
      hasPlayedHomeCourse = rounds.some((r) => {
        const round = listRoundsForPlayer(db, player.id).find((x) => x.id === r.id);
        return round?.course_id === player.home_course_id;
      });
    }
  }
  return {
    snapshots: trend,
    rounds,
    latestIndex: trend[trend.length - 1]?.index ?? null,
    priorIndex: trend[trend.length - 2]?.index ?? null,
    homeCourseLabel,
    homeCourseId: player.home_course_id,
    hasPlayedHomeCourse,
  };
}

export default function Home(): JSX.Element {
  const data = useMemo(() => loadHome(), []);
  const greeting = greetingForHour(new Date().getHours());
  const { refreshControl } = useRefresh();

  const hasFocusedRef = useRef(false);
  const [skipEntry, setSkipEntry] = useState(false);
  useFocusEffect(
    useCallback(() => {
      if (hasFocusedRef.current) {
        setSkipEntry(true);
      } else {
        hasFocusedRef.current = true;
        setSkipEntry(false);
      }
    }, []),
  );

  const delta =
    data.latestIndex !== null && data.priorIndex !== null
      ? data.latestIndex - data.priorIndex
      : 0;
  const deltaText =
    data.latestIndex === null || data.priorIndex === null
      ? '—'
      : delta === 0
        ? 'No change from last round'
        : `${delta < 0 ? '↓' : '↑'} ${Math.abs(delta).toFixed(1)} from last round`;
  const deltaColor = delta <= 0 ? MASTERS_GREEN : ACCENT_GOLD;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#F5F5F2' }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 4,
        }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            Haptics.selectionAsync().catch(() => undefined);
            router.push('/history');
          }}
          hitSlop={10}
        >
          <CalendarBlank size={22} color={MUTED_TEXT} weight="duotone" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            Haptics.selectionAsync().catch(() => {
              /* haptics unavailable — ignore */
            });
            router.push('/settings');
          }}
          hitSlop={10}
        >
          <GearSix size={22} color={MUTED_TEXT} weight="duotone" />
        </Pressable>
      </View>
      <ScrollView
        refreshControl={refreshControl}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      >
        <GlassCard className="px-0 py-0">
          <View className="px-8 pt-8">
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 14,
                color: MUTED_TEXT,
                letterSpacing: 0.4,
              }}
            >
              {greeting.toUpperCase()}
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 14,
                color: MUTED_TEXT,
                marginTop: 4,
              }}
            >
              {data.homeCourseLabel === null
                ? 'Your handicap index, tracking quietly.'
                : data.hasPlayedHomeCourse
                  ? `Last played at ${data.homeCourseLabel}.`
                  : `Ready to play ${data.homeCourseLabel}?`}
            </Text>

            <View style={{ marginTop: 18, alignItems: 'flex-start' }}>
              <Text
                style={{
                  fontFamily: 'Fraunces_700Bold',
                  fontSize: 88,
                  lineHeight: 96,
                  color: '#0F172A',
                  letterSpacing: -2,
                }}
              >
                {data.latestIndex !== null ? data.latestIndex.toFixed(1) : '—'}
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter_500Medium',
                  fontSize: 13,
                  color: deltaColor,
                  marginTop: 4,
                }}
              >
                {deltaText}
              </Text>
            </View>
          </View>

          <View className="mt-4 px-8">
            <HandicapTrendChart snapshots={data.snapshots} skipEntry={skipEntry} />
          </View>

          <View
            className="mt-6 px-8 pb-8"
            style={{ flexDirection: 'row', justifyContent: 'space-between' }}
          >
            <Link
              href="/recommendations"
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 13,
                color: MASTERS_GREEN,
              }}
            >
              Recommendations →
            </Link>
            <Link
              href="/debug"
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 13,
                color: MUTED_TEXT,
              }}
            >
              Debug
            </Link>
          </View>
        </GlassCard>

        <RoundsLately rounds={data.rounds} />

        {data.rounds.length > 0 ? (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 12,
              paddingHorizontal: 24,
            }}
          >
            <Link
              href="/history"
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 13,
                color: MUTED_TEXT,
              }}
            >
              View all rounds →
            </Link>
            <Link
              href="/courses"
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 13,
                color: MUTED_TEXT,
              }}
            >
              Browse my courses →
            </Link>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
