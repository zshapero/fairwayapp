import { Link, router } from 'expo-router';
import { type JSX, useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '@/components/GlassCard';
import { getDb } from '@/core/db/database';
import { getCourseStats, listCourses } from '@/core/db/repositories/courses';
import { listPlayers } from '@/core/db/repositories/players';
import {
  ACCENT_GOLD,
  CREAM,
  DIVIDER,
  MUTED_TEXT,
} from '@/theme/colors';

interface CourseRow {
  id: number;
  label: string;
  location: string | null;
  roundsCount: number;
  lastPlayedAt: string | null;
}

function loadCourses(): CourseRow[] {
  const db = getDb();
  const player = listPlayers(db)[0];
  if (player === undefined) return [];
  return listCourses(db)
    .map((c) => {
      const stats = getCourseStats(db, c.id, player.id);
      const label =
        c.course_name !== null ? `${c.club_name} · ${c.course_name}` : c.club_name;
      const location = [c.city, c.state]
        .filter((v): v is string => v !== null && v !== '')
        .join(', ');
      return {
        id: c.id,
        label,
        location: location === '' ? null : location,
        roundsCount: stats.roundsCount,
        lastPlayedAt: stats.lastPlayedAt,
      };
    })
    .sort((a, b) => {
      // Most-recently-played first; never-played at the bottom.
      if (a.lastPlayedAt === null && b.lastPlayedAt === null) return 0;
      if (a.lastPlayedAt === null) return 1;
      if (b.lastPlayedAt === null) return -1;
      return b.lastPlayedAt.localeCompare(a.lastPlayedAt);
    });
}

export default function CoursesIndex(): JSX.Element {
  const rows = useMemo(() => loadCourses(), []);
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
          href="/"
          style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: MUTED_TEXT }}
        >
          ← Home
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
          Courses
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        <Text
          style={{
            fontFamily: 'Fraunces_700Bold',
            fontSize: 28,
            color: '#0F172A',
            marginTop: 8,
          }}
        >
          My courses
        </Text>
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 13,
            color: MUTED_TEXT,
            marginTop: 4,
          }}
        >
          Tap any course to see the patterns hidden in your rounds.
        </Text>

        <View style={{ marginTop: 16 }}>
          {rows.length === 0 ? (
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                color: MUTED_TEXT,
                marginTop: 24,
                textAlign: 'center',
              }}
            >
              No courses yet. They&apos;ll show up here as you play.
            </Text>
          ) : (
            <GlassCard className="px-0 py-0">
              {rows.map((r, i) => (
                <Pressable
                  key={r.id}
                  accessibilityRole="button"
                  onPress={() => router.push(`/courses/${r.id}`)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    borderBottomWidth: i === rows.length - 1 ? 0 : 0.5,
                    borderBottomColor: DIVIDER,
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: 'Fraunces_500Medium',
                        fontSize: 17,
                        color: '#0F172A',
                      }}
                      numberOfLines={1}
                    >
                      {r.label}
                    </Text>
                    {r.location !== null ? (
                      <Text
                        style={{
                          fontFamily: 'Inter_400Regular',
                          fontStyle: 'italic',
                          fontSize: 12,
                          color: MUTED_TEXT,
                          marginTop: 2,
                        }}
                      >
                        {r.location}
                      </Text>
                    ) : null}
                  </View>
                  <View style={{ alignItems: 'flex-end', marginRight: 10 }}>
                    <Text
                      style={{
                        fontFamily: 'Inter_500Medium',
                        fontSize: 12,
                        color: ACCENT_GOLD,
                      }}
                    >
                      {r.roundsCount > 0
                        ? `${r.roundsCount} round${r.roundsCount === 1 ? '' : 's'}`
                        : 'Imported'}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontFamily: 'Inter_500Medium',
                      fontSize: 18,
                      color: MUTED_TEXT,
                    }}
                  >
                    ›
                  </Text>
                </Pressable>
              ))}
            </GlassCard>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
