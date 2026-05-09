import { LinearGradient } from 'expo-linear-gradient';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { type JSX, useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { GlassCard } from '@/components/GlassCard';
import { useRefresh } from '@/components/PullToRefresh';
import { TroubleHoles } from '@/components/course-detail/TroubleHoles';
import { TeesPlayed } from '@/components/course-detail/TeesPlayed';
import { HandicapTrendChart } from '@/components/HandicapTrendChart';
import type { SnapshotPoint } from '@/components/HandicapTrendChart';
import { RoundCard } from '@/components/home/RoundCard';
import type { RoundCardData } from '@/components/home/RoundCard';
import { SectionHeading } from '@/components/round-detail/SectionHeading';
import { getDb } from '@/core/db/database';
import {
  getCourse,
  getCourseStats,
  getRoundDifferentialsAtCourse,
  getTroubleHoles,
} from '@/core/db/repositories/courses';
import { listPlayers } from '@/core/db/repositories/players';
import { listRoundsAtCourseForPlayer } from '@/core/db/repositories/rounds';
import { listTeesForCourse } from '@/core/db/repositories/tees';
import { listTeeHoles } from '@/core/db/repositories/teeHoles';
import type { Tee, TeeHole } from '@/core/db/types';
import {
  ACCENT_GOLD,
  CREAM,
  DIVIDER,
  MASTERS_GREEN,
  MUTED_TEXT,
} from '@/theme/colors';

const MONTHS = [
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

function relativeFromNow(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.round(ms / 86_400_000);
  if (days < 1) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 14) return `${days} days ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 8) return `${weeks} weeks ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} months ago`;
  const years = Math.round(days / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

interface LoadedCourse {
  course: NonNullable<ReturnType<typeof getCourse>>;
  playerId: number;
  stats: ReturnType<typeof getCourseStats>;
  trouble: ReturnType<typeof getTroubleHoles>;
  trend: SnapshotPoint[];
  tees: { tee: Tee; holes: TeeHole[]; roundsCount: number }[];
  rounds: RoundCardData[];
  cardLocation: string | null;
  firstPlayed: string | null;
}

function loadCourse(courseId: number): LoadedCourse | null {
  const db = getDb();
  const course = getCourse(db, courseId);
  if (course === null) return null;
  const player = listPlayers(db)[0];
  if (player === undefined) return null;
  const stats = getCourseStats(db, course.id, player.id);
  const trouble = getTroubleHoles(db, course.id, player.id, 3);
  const points = getRoundDifferentialsAtCourse(db, course.id, player.id);
  const trend: SnapshotPoint[] = points.map((p) => ({
    date: new Date(p.date),
    index: p.differential,
  }));
  const teeRows = listTeesForCourse(db, course.id);
  const teeHoles = teeRows.map((t) => ({
    tee: t,
    holes: listTeeHoles(db, t.id),
    roundsCount: 0,
  }));
  const rounds = listRoundsAtCourseForPlayer(db, player.id, course.id);
  const cardData: RoundCardData[] = rounds.map((r) => ({
    id: r.id,
    courseName: '',
    playedAt: new Date(r.played_at),
    grossScore: r.adjusted_gross_score ?? 0,
    parTotal:
      teeHoles
        .find((t) => t.tee.id === r.tee_id)
        ?.holes.reduce((s, h) => s + h.par, 0) ?? 72,
  }));
  const cardLocation = [course.city, course.state]
    .filter((v): v is string => v !== null && v !== '')
    .join(', ');
  return {
    course,
    playerId: player.id,
    stats,
    trouble,
    trend,
    tees: teeHoles,
    rounds: cardData,
    cardLocation: cardLocation === '' ? null : cardLocation,
    firstPlayed: rounds[rounds.length - 1]?.played_at ?? null,
  };
}

export default function CourseDetail(): JSX.Element {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number.parseInt(params.id ?? '', 10);
  const data = useMemo(() => {
    if (Number.isNaN(id)) return null;
    return loadCourse(id);
  }, [id]);
  const { refreshControl } = useRefresh();

  if (data === null) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: CREAM, padding: 24 }}>
        <Link
          href="/"
          style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: MUTED_TEXT }}
        >
          ← Back
        </Link>
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            color: MUTED_TEXT,
            marginTop: 16,
          }}
        >
          That course couldn&apos;t be loaded.
        </Text>
      </SafeAreaView>
    );
  }

  const {
    course,
    stats,
    trouble,
    trend,
    tees,
    rounds,
    cardLocation,
    firstPlayed,
  } = data;
  const courseLabel =
    course.course_name !== null
      ? `${course.club_name} · ${course.course_name}`
      : course.club_name;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: CREAM }}>
      <Link
        href="/courses"
        style={{
          fontFamily: 'Inter_500Medium',
          fontSize: 13,
          color: MUTED_TEXT,
          marginLeft: 20,
          marginTop: 8,
        }}
      >
        ← Courses
      </Link>

      <ScrollView
        refreshControl={refreshControl}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Hero */}
        <Animated.View
          entering={FadeIn.duration(300)}
          style={{ paddingTop: 56, paddingBottom: 64 }}
        >
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflow: 'hidden',
            }}
          >
            <LinearGradient
              colors={['#5A7A4F', '#3E5C39', CREAM]}
              locations={[0, 0.55, 1]}
              style={{ flex: 1, opacity: 0.16 }}
            />
          </View>
          <View style={{ paddingHorizontal: 24, alignItems: 'center' }}>
            <Text
              numberOfLines={2}
              ellipsizeMode="tail"
              style={{
                fontFamily: 'Fraunces_500Medium',
                fontSize: 36,
                lineHeight: 42,
                color: '#0F172A',
                textAlign: 'center',
                letterSpacing: -0.5,
              }}
            >
              {courseLabel}
            </Text>
            {cardLocation !== null ? (
              <Text
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontStyle: 'italic',
                  fontSize: 14,
                  color: MUTED_TEXT,
                  marginTop: 6,
                }}
              >
                {cardLocation}
              </Text>
            ) : null}
            <View
              style={{
                flexDirection: 'row',
                gap: 8,
                marginTop: 16,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <Pill text={`Played ${stats.roundsCount} time${stats.roundsCount === 1 ? '' : 's'}`} />
              {stats.lastPlayedAt !== null ? (
                <Pill text={`Last: ${relativeFromNow(stats.lastPlayedAt)}`} />
              ) : null}
            </View>
          </View>
        </Animated.View>

        {/* Stats */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(100)}
          style={{
            flexDirection: 'row',
            paddingHorizontal: 20,
            paddingVertical: 16,
          }}
        >
          <StatCell label="Best score" value={stats.bestScore !== null ? String(stats.bestScore) : '—'} />
          <View style={{ width: 0.5, height: 40, backgroundColor: DIVIDER }} />
          <StatCell
            label="Average score"
            value={stats.averageScore !== null ? stats.averageScore.toFixed(1) : '—'}
          />
          <View style={{ width: 0.5, height: 40, backgroundColor: DIVIDER }} />
          <StatCell
            label="Best diff"
            value={stats.bestDifferential !== null ? stats.bestDifferential.toFixed(1) : '—'}
          />
        </Animated.View>

        {/* Course trend mini-chart */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(200)}
          style={{ paddingHorizontal: 20, marginTop: 16 }}
        >
          <SectionHeading label="Your scoring here" />
          {stats.roundsCount < 3 ? (
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 13,
                color: MUTED_TEXT,
                marginTop: 12,
              }}
            >
              Play more rounds here and we&apos;ll show your scoring trend.
            </Text>
          ) : (
            <View style={{ marginTop: 8 }}>
              <HandicapTrendChart snapshots={trend} height={120} skipEntry />
              {firstPlayed !== null && stats.lastPlayedAt !== null ? (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginTop: 8,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'Inter_400Regular',
                      fontStyle: 'italic',
                      fontSize: 11,
                      color: MUTED_TEXT,
                    }}
                  >
                    {`First played ${formatDate(firstPlayed)}`}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Inter_400Regular',
                      fontStyle: 'italic',
                      fontSize: 11,
                      color: MUTED_TEXT,
                    }}
                  >
                    {`Last played ${formatDate(stats.lastPlayedAt)}`}
                  </Text>
                </View>
              ) : null}
            </View>
          )}
        </Animated.View>

        {/* Trouble holes */}
        {stats.roundsCount >= 5 && trouble.length > 0 ? (
          <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
            <SectionHeading label="Holes that have given you trouble" />
            <View style={{ marginTop: 14 }}>
              <TroubleHoles holes={trouble} />
            </View>
          </View>
        ) : null}

        {/* Tees played */}
        <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
          <SectionHeading label="Tees you've played here" />
          <View style={{ marginTop: 14 }}>
            <TeesPlayed tees={tees} mostPlayedTeeId={stats.mostPlayedTeeId} />
          </View>
        </View>

        {/* Every round */}
        {rounds.length > 0 ? (
          <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
            <SectionHeading label="Every round here" />
            <View style={{ marginTop: 8 }}>
              <GlassCard className="px-0 py-0">
                <View>
                  {rounds.map((r, i) => (
                    <View
                      key={r.id}
                      style={{
                        borderBottomWidth: i === rounds.length - 1 ? 0 : 0.5,
                        borderBottomColor: DIVIDER,
                      }}
                    >
                      <RoundCard
                        round={{
                          ...r,
                          courseName: courseLabel,
                        }}
                      />
                    </View>
                  ))}
                </View>
              </GlassCard>
            </View>
          </View>
        ) : null}

        {/* CTA */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(500)}
          style={{ paddingHorizontal: 20, marginTop: 24 }}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/play/select-tee?courseId=${course.id}`)}
            style={({ pressed }) => ({
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: 'center',
              backgroundColor: MASTERS_GREEN,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 15,
                color: 'white',
                letterSpacing: 0.4,
              }}
            >
              Start a round here
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Pill({ text }: { text: string }): JSX.Element {
  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: 'rgba(184, 134, 44, 0.10)',
      }}
    >
      <Text
        style={{
          fontFamily: 'Inter_500Medium',
          fontSize: 11,
          letterSpacing: 0.6,
          color: ACCENT_GOLD,
          textTransform: 'uppercase',
        }}
      >
        {text}
      </Text>
    </View>
  );
}

function StatCell({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 4 }}>
      <Text
        style={{
          fontFamily: 'Inter_500Medium',
          fontSize: 11,
          letterSpacing: 1.1,
          color: ACCENT_GOLD,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: 'Fraunces_600SemiBold',
          fontSize: 28,
          color: '#0F172A',
          marginTop: 6,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
