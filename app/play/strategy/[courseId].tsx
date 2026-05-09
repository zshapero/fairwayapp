import { Link, router, useLocalSearchParams } from 'expo-router';
import { type JSX, useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { getDb } from '@/core/db/database';
import { getCourse } from '@/core/db/repositories/courses';
import { listPlayers } from '@/core/db/repositories/players';
import {
  generateHoleStrategies,
  priorRoundsCount,
} from '@/services/courseStrategy';
import {
  ACCENT_GOLD,
  CREAM,
  DIVIDER,
  MASTERS_GREEN,
  MUTED_TEXT,
} from '@/theme/colors';

interface LoadedStrategy {
  courseLabel: string;
  rounds: number;
  strategies: ReturnType<typeof generateHoleStrategies>;
}

function loadStrategy(courseId: number): LoadedStrategy | null {
  const db = getDb();
  const course = getCourse(db, courseId);
  const player = listPlayers(db)[0];
  if (course === null || player === undefined) return null;
  return {
    courseLabel:
      course.course_name !== null
        ? `${course.club_name} · ${course.course_name}`
        : course.club_name,
    rounds: priorRoundsCount(courseId, player.id),
    strategies: generateHoleStrategies(courseId, player.id),
  };
}

function pct(rate: number | null): string {
  if (rate === null) return '—';
  return `${Math.round(rate * 100)}%`;
}

export default function CourseStrategy(): JSX.Element {
  const params = useLocalSearchParams<{ courseId: string }>();
  const courseId = Number.parseInt(params.courseId ?? '', 10);
  const data = useMemo<LoadedStrategy | null>(() => {
    if (Number.isNaN(courseId)) return null;
    return loadStrategy(courseId);
  }, [courseId]);

  if (data === null) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: CREAM, padding: 24 }}>
        <Link
          href="/"
          style={{
            fontFamily: 'Inter_500Medium',
            fontSize: 14,
            color: MUTED_TEXT,
          }}
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
          href={`/play/select-tee?courseId=${courseId}`}
          style={{
            fontFamily: 'Inter_500Medium',
            fontSize: 14,
            color: MUTED_TEXT,
          }}
        >
          ← Back
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
          Strategy
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
          Your patterns at
        </Text>
        <Text
          style={{
            fontFamily: 'Fraunces_500Medium',
            fontSize: 28,
            color: '#0F172A',
            marginTop: 6,
            letterSpacing: -0.5,
          }}
          numberOfLines={2}
        >
          {data.courseLabel}
        </Text>
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 13,
            color: MUTED_TEXT,
            marginTop: 6,
          }}
        >
          {`Across ${data.rounds} round${data.rounds === 1 ? '' : 's'} here. Holes shown have at least 3 plays.`}
        </Text>

        <View style={{ marginTop: 20 }}>
          {data.strategies.length === 0 ? (
            <EmptyState
              illustration="flag"
              message={
                data.rounds < 3
                  ? `Play ${3 - data.rounds} more round${data.rounds === 2 ? '' : 's'} here and we'll start surfacing patterns.`
                  : 'No hole has 3+ plays yet. Keep posting rounds.'
              }
            />
          ) : (
            data.strategies.map((s) => (
              <View key={s.holeNumber} style={{ marginBottom: 12 }}>
                <GlassCard className="px-0 py-0">
                  <View style={{ flexDirection: 'row', padding: 16 }}>
                    <View
                      style={{
                        width: 56,
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'Fraunces_700Bold',
                          fontSize: 28,
                          color: '#0F172A',
                          letterSpacing: -0.5,
                        }}
                      >
                        {s.holeNumber}
                      </Text>
                      <Text
                        style={{
                          fontFamily: 'Inter_500Medium',
                          fontSize: 10,
                          letterSpacing: 0.8,
                          color: MUTED_TEXT,
                          marginTop: 2,
                          textTransform: 'uppercase',
                        }}
                      >
                        {`Par ${s.par}`}
                      </Text>
                    </View>
                    <View
                      style={{
                        flex: 1,
                        marginLeft: 8,
                        borderLeftWidth: 0.5,
                        borderLeftColor: DIVIDER,
                        paddingLeft: 14,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'Fraunces_500Medium',
                          fontSize: 15,
                          lineHeight: 22,
                          color: '#0F172A',
                        }}
                      >
                        {s.tendency}
                      </Text>
                      <View
                        style={{
                          flexDirection: 'row',
                          flexWrap: 'wrap',
                          gap: 14,
                          marginTop: 10,
                        }}
                      >
                        <Stat label="Avg" value={s.averageScore.toFixed(1)} />
                        <Stat
                          label="Best"
                          value={String(s.bestEverScore)}
                        />
                        <Stat
                          label="Fairway"
                          value={pct(s.fairwayHitRate)}
                        />
                        <Stat label="GIR" value={pct(s.girHitRate)} />
                        {s.averagePutts !== null ? (
                          <Stat
                            label="Putts"
                            value={s.averagePutts.toFixed(1)}
                          />
                        ) : null}
                      </View>
                    </View>
                  </View>
                </GlassCard>
              </View>
            ))
          )}
        </View>
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
            Continue to score
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <View>
      <Text
        style={{
          fontFamily: 'Inter_500Medium',
          fontSize: 9,
          letterSpacing: 0.8,
          color: MUTED_TEXT,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: 'Fraunces_500Medium',
          fontSize: 14,
          color: '#0F172A',
          marginTop: 2,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
