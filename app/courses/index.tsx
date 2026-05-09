import { useQueryClient } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { type JSX, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { useRefresh } from '@/components/PullToRefresh';
import { useToast } from '@/components/Toast';
import { getDb } from '@/core/db/database';
import {
  deleteCourse,
  getCourseStats,
  listCourses,
  setFavorite,
} from '@/core/db/repositories/courses';
import {
  listPlayers,
  setHomeCourse as setHomeCoursePlayer,
} from '@/core/db/repositories/players';
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
  isFavorite: boolean;
  isHome: boolean;
}

function relativeDate(iso: string | null): string | null {
  if (iso === null) return null;
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 14) return `${days} days ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 8) return `${weeks} weeks ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} months ago`;
  return `${Math.round(days / 365)} years ago`;
}

function loadCourses(): CourseRow[] {
  const db = getDb();
  const player = listPlayers(db)[0];
  const homeCourseId = player?.home_course_id ?? null;
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
        isFavorite: c.is_favorite === 1,
        isHome: c.id === homeCourseId,
      };
    })
    .sort((a, b) => {
      if (a.isHome !== b.isHome) return a.isHome ? -1 : 1;
      if (a.lastPlayedAt === null && b.lastPlayedAt === null) return 0;
      if (a.lastPlayedAt === null) return 1;
      if (b.lastPlayedAt === null) return -1;
      return b.lastPlayedAt.localeCompare(a.lastPlayedAt);
    });
}

export default function CoursesIndex(): JSX.Element {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { refreshControl } = useRefresh();
  const [refreshNonce, setRefreshNonce] = useState(0);
  // refreshNonce is used as the only dep so loadCourses re-runs after data changes.
  const rows = useMemo(
    () => {
      void refreshNonce;
      return loadCourses();
    },
    [refreshNonce],
  );
  const [contextRow, setContextRow] = useState<CourseRow | null>(null);

  const refresh = (): void => {
    setRefreshNonce((n) => n + 1);
    queryClient.invalidateQueries();
  };

  const removeCourse = (row: CourseRow): void => {
    if (row.roundsCount > 0) {
      Alert.alert(
        'You have rounds at this course.',
        'Delete them first.',
      );
      return;
    }
    deleteCourse(getDb(), row.id);
    toast.show('Removed from your courses');
    refresh();
  };

  const toggleHome = (row: CourseRow): void => {
    const db = getDb();
    const player = listPlayers(db)[0];
    if (player === undefined) return;
    if (row.isHome) {
      setHomeCoursePlayer(db, player.id, null);
      setFavorite(db, row.id, 0);
      toast.show('Home course cleared');
    } else {
      setHomeCoursePlayer(db, player.id, row.id);
      setFavorite(db, row.id, 1);
      toast.show(`${row.label.split(' · ')[0]} is your home course`);
    }
    refresh();
  };

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

      <ScrollView
        refreshControl={refreshControl}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
      >
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
          Tap any course to see the patterns hidden in your rounds. Long-press for
          options.
        </Text>

        <View style={{ marginTop: 16 }}>
          {rows.length === 0 ? (
            <EmptyState
              illustration="tee"
              message="No courses yet. They'll show up here as you play."
              cta={{
                label: 'Search a course',
                onPress: () => router.push('/search'),
              }}
            />
          ) : (
            <GlassCard className="px-0 py-0">
              {rows.map((r, i) => (
                <Pressable
                  key={r.id}
                  accessibilityRole="button"
                  onPress={() => router.push(`/courses/${r.id}`)}
                  onLongPress={() => setContextRow(r)}
                  delayLongPress={300}
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text
                        style={{
                          fontFamily: 'Fraunces_500Medium',
                          fontSize: 17,
                          color: '#0F172A',
                          flexShrink: 1,
                        }}
                        numberOfLines={1}
                      >
                        {r.label}
                      </Text>
                      {r.isHome ? (
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 999,
                            backgroundColor: 'rgba(184, 134, 44, 0.15)',
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: 'Inter_500Medium',
                              fontSize: 9,
                              letterSpacing: 0.6,
                              color: ACCENT_GOLD,
                              textTransform: 'uppercase',
                            }}
                          >
                            Home
                          </Text>
                        </View>
                      ) : null}
                    </View>
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
                    {r.lastPlayedAt !== null ? (
                      <Text
                        style={{
                          fontFamily: 'Inter_400Regular',
                          fontSize: 11,
                          color: MUTED_TEXT,
                          marginTop: 2,
                        }}
                      >
                        {`Last played ${relativeDate(r.lastPlayedAt)}`}
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

      <Modal
        visible={contextRow !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setContextRow(null)}
      >
        <Pressable
          onPress={() => setContextRow(null)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: '#FAF6EC',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 24,
            }}
          >
            <Text
              style={{
                fontFamily: 'Fraunces_600SemiBold',
                fontSize: 18,
                color: '#0F172A',
              }}
            >
              {contextRow?.label}
            </Text>
            <Pressable
              onPress={() => {
                if (contextRow !== null) toggleHome(contextRow);
                setContextRow(null);
              }}
              style={{
                paddingVertical: 14,
                borderBottomWidth: 0.5,
                borderBottomColor: DIVIDER,
                marginTop: 12,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Inter_500Medium',
                  fontSize: 15,
                  color: '#0F172A',
                }}
              >
                {contextRow?.isHome ? 'Remove home course' : 'Set as home course'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (contextRow !== null) removeCourse(contextRow);
                setContextRow(null);
              }}
              style={{ paddingVertical: 14 }}
            >
              <Text
                style={{
                  fontFamily: 'Inter_500Medium',
                  fontSize: 15,
                  color: '#A6553D',
                }}
              >
                Remove from my courses
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setContextRow(null)}
              style={{ paddingVertical: 12, alignItems: 'center', marginTop: 8 }}
            >
              <Text
                style={{
                  fontFamily: 'Inter_500Medium',
                  fontSize: 14,
                  color: MUTED_TEXT,
                }}
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
