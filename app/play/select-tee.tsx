import { Link, router, useLocalSearchParams } from 'expo-router';
import { type JSX, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '@/components/GlassCard';
import { getDb } from '@/core/db/database';
import { getCourse, listCourses } from '@/core/db/repositories/courses';
import { listPlayers } from '@/core/db/repositories/players';
import { listTeesForCourse } from '@/core/db/repositories/tees';
import type { Tee } from '@/core/db/types';
import { priorRoundsCount } from '@/services/courseStrategy';
import {
  ACCENT_GOLD,
  CREAM,
  DIVIDER,
  MASTERS_GREEN,
  MUTED_TEXT,
} from '@/theme/colors';

const TEE_DOT_COLORS: Record<string, string> = {
  black: '#111111',
  blue: '#1E60D0',
  white: '#F2F2F2',
  red: '#C9433A',
  gold: '#C9A23A',
  green: MASTERS_GREEN,
};

function dotColorFor(name: string): string {
  return TEE_DOT_COLORS[name.toLowerCase()] ?? MUTED_TEXT;
}

interface LoadedSelection {
  courseId: number;
  courseLabel: string;
  tees: Tee[];
  priorRounds: number;
  defaultTeeId: number | null;
}

function loadSelection(initialCourseId: number | null): LoadedSelection | null {
  const db = getDb();
  const player = listPlayers(db)[0];
  if (player === undefined) return null;
  const courses = listCourses(db);
  let course = initialCourseId !== null ? getCourse(db, initialCourseId) : null;
  if (course === null) {
    course =
      courses.find((c) => c.id === player.home_course_id) ??
      courses[0] ??
      null;
  }
  if (course === null) return null;
  return {
    courseId: course.id,
    courseLabel:
      course.course_name !== null
        ? `${course.club_name} · ${course.course_name}`
        : course.club_name,
    tees: listTeesForCourse(db, course.id),
    priorRounds: priorRoundsCount(course.id, player.id),
    defaultTeeId: player.preferred_tee_id,
  };
}

export default function SelectTee(): JSX.Element {
  const params = useLocalSearchParams<{ courseId?: string }>();
  const initialId =
    params.courseId !== undefined ? Number.parseInt(params.courseId, 10) : NaN;
  const data = useMemo(
    () => loadSelection(Number.isNaN(initialId) ? null : initialId),
    [initialId],
  );
  const initialTeeId = data?.defaultTeeId ?? data?.tees[0]?.id ?? null;
  const [selectedTeeId, setSelectedTeeId] = useState<number | null>(initialTeeId);

  if (data === null) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: CREAM, padding: 24 }}>
        <Link
          href="/"
          style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: MUTED_TEXT }}
        >
          ← Home
        </Link>
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            color: MUTED_TEXT,
            marginTop: 16,
          }}
        >
          Add a course before starting a round.
        </Text>
      </SafeAreaView>
    );
  }

  const showStrategy = data.priorRounds >= 1;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: CREAM }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 24,
          paddingVertical: 8,
        }}
      >
        <Link
          href="/courses"
          style={{
            fontFamily: 'Inter_500Medium',
            fontSize: 14,
            color: MUTED_TEXT,
          }}
        >
          ← Courses
        </Link>
        <Text
          style={{
            fontFamily: 'Inter_500Medium',
            fontSize: 13,
            letterSpacing: 0.6,
            color: MUTED_TEXT,
            textTransform: 'uppercase',
          }}
        >
          Start a round
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 96 }}>
        <Text
          style={{
            fontFamily: 'Inter_500Medium',
            fontSize: 11,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: ACCENT_GOLD,
          }}
        >
          Playing
        </Text>
        <Text
          style={{
            fontFamily: 'Fraunces_500Medium',
            fontSize: 26,
            color: '#0F172A',
            marginTop: 6,
            letterSpacing: -0.5,
          }}
          numberOfLines={2}
        >
          {data.courseLabel}
        </Text>

        <View style={{ marginTop: 20 }}>
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 11,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              color: ACCENT_GOLD,
              marginBottom: 8,
            }}
          >
            Select tees
          </Text>
          <GlassCard className="px-0 py-0">
            {data.tees.map((t, i) => {
              const selected = t.id === selectedTeeId;
              return (
                <Pressable
                  key={t.id}
                  accessibilityRole="button"
                  onPress={() => setSelectedTeeId(t.id)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    paddingVertical: 14,
                    borderBottomWidth: i === data.tees.length - 1 ? 0 : 0.5,
                    borderBottomColor: DIVIDER,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 7,
                      backgroundColor: dotColorFor(t.tee_name),
                      borderWidth: 1,
                      borderColor: 'rgba(15, 23, 42, 0.2)',
                      marginRight: 12,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: 'Fraunces_500Medium',
                        fontSize: 16,
                        color: '#0F172A',
                      }}
                    >
                      {t.tee_name}
                    </Text>
                    <Text
                      style={{
                        fontFamily: 'Inter_400Regular',
                        fontSize: 12,
                        color: MUTED_TEXT,
                        marginTop: 2,
                      }}
                    >
                      {`Par ${t.par_total ?? '—'} · ${t.total_yards ?? '—'} yards · ${t.course_rating.toFixed(1)} / ${t.slope_rating}`}
                    </Text>
                  </View>
                  {selected ? (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: MASTERS_GREEN,
                      }}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </GlassCard>
        </View>

        {showStrategy ? (
          <View style={{ marginTop: 24 }}>
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 11,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                color: ACCENT_GOLD,
                marginBottom: 8,
              }}
            >
              Course tips
            </Text>
            <GlassCard className="px-0 py-0">
              <View style={{ padding: 18 }}>
                <Text
                  style={{
                    fontFamily: 'Fraunces_500Medium',
                    fontSize: 16,
                    color: '#0F172A',
                  }}
                >
                  {`You've played this course ${data.priorRounds} time${data.priorRounds === 1 ? '' : 's'}.`}
                </Text>
                <Text
                  style={{
                    fontFamily: 'Inter_400Regular',
                    fontStyle: 'italic',
                    fontSize: 13,
                    lineHeight: 19,
                    color: MUTED_TEXT,
                    marginTop: 6,
                  }}
                >
                  We&apos;ve been watching the patterns. Take a minute to look
                  at what we&apos;re seeing before you tee off.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    router.push(`/play/strategy/${data.courseId}`)
                  }
                  style={({ pressed }) => ({
                    marginTop: 14,
                    alignSelf: 'flex-start',
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: 'rgba(11, 107, 58, 0.10)',
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text
                    style={{
                      fontFamily: 'Inter_500Medium',
                      fontSize: 13,
                      color: MASTERS_GREEN,
                    }}
                  >
                    View pre-round strategy →
                  </Text>
                </Pressable>
              </View>
            </GlassCard>
          </View>
        ) : null}
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 20,
          backgroundColor: CREAM,
          borderTopWidth: 0.5,
          borderTopColor: DIVIDER,
        }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/play/summary')}
          disabled={selectedTeeId === null}
          style={({ pressed }) => ({
            paddingVertical: 16,
            borderRadius: 14,
            alignItems: 'center',
            backgroundColor: MASTERS_GREEN,
            opacity: selectedTeeId === null ? 0.4 : pressed ? 0.85 : 1,
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
            Start round
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
