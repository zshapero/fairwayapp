import { router } from 'expo-router';
import { type JSX, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useToast } from '@/components/Toast';
import { getDb } from '@/core/db/database';
import {
  listCourses,
  setFavorite,
} from '@/core/db/repositories/courses';
import {
  listPlayers,
  setHomeCourse as setHomeCourseRow,
} from '@/core/db/repositories/players';
import { recordSearch } from '@/core/db/repositories/recentSearches';
import { trackEvent } from '@/services/analytics';
import {
  ACCENT_GOLD,
  CREAM,
  DIVIDER,
  MASTERS_GREEN,
  MUTED_TEXT,
} from '@/theme/colors';

export default function HomeCourse(): JSX.Element {
  const [q, setQ] = useState('');
  const toast = useToast();
  const allCourses = useMemo(() => listCourses(getDb()), []);
  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term === '') return [];
    return allCourses.filter((c) =>
      `${c.club_name} ${c.course_name ?? ''} ${c.city ?? ''}`
        .toLowerCase()
        .includes(term),
    );
  }, [allCourses, q]);

  const pickCourse = (courseId: number, label: string): void => {
    const db = getDb();
    setFavorite(db, courseId, 1);
    const player = listPlayers(db)[0];
    if (player !== undefined) {
      setHomeCourseRow(db, player.id, courseId);
    }
    if (q.trim() !== '') recordSearch(db, q.trim());
    toast.show(`Saved ${label} as your home course`);
    setTimeout(() => router.push('/onboarding/finish'), 600);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: CREAM }}>
      <View style={{ flex: 1, paddingHorizontal: 32 }}>
        <Text
          style={{
            fontFamily: 'Inter_500Medium',
            fontSize: 11,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: ACCENT_GOLD,
            marginTop: 24,
          }}
        >
          Step 3 of 3
        </Text>
        <Text
          style={{
            fontFamily: 'Fraunces_500Medium',
            fontSize: 32,
            color: '#0F172A',
            marginTop: 12,
            letterSpacing: -0.5,
          }}
        >
          Where do you usually play?
        </Text>
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 15,
            lineHeight: 22,
            color: MUTED_TEXT,
            marginTop: 8,
          }}
        >
          We&apos;ll preload your home course so you can post a round right away.
          Don&apos;t have one yet? You can skip this.
        </Text>

        <View style={{ marginTop: 24 }}>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search a course"
            placeholderTextColor="rgba(15, 23, 42, 0.4)"
            autoFocus
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 16,
              color: '#0F172A',
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 12,
              backgroundColor: 'rgba(15, 23, 42, 0.04)',
            }}
          />
          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={{ marginTop: 12, maxHeight: 320 }}
          >
            {results.map((c) => {
              const label = c.course_name !== null ? `${c.club_name} · ${c.course_name}` : c.club_name;
              return (
                <Pressable
                  key={c.id}
                  accessibilityRole="button"
                  onPress={() => pickCourse(c.id, c.club_name)}
                  style={({ pressed }) => ({
                    paddingVertical: 14,
                    borderBottomWidth: 0.5,
                    borderBottomColor: DIVIDER,
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  <Text
                    style={{
                      fontFamily: 'Fraunces_500Medium',
                      fontSize: 16,
                      color: '#0F172A',
                    }}
                  >
                    {label}
                  </Text>
                  {c.city !== null || c.state !== null ? (
                    <Text
                      style={{
                        fontFamily: 'Inter_400Regular',
                        fontStyle: 'italic',
                        fontSize: 12,
                        color: MUTED_TEXT,
                        marginTop: 2,
                      }}
                    >
                      {[c.city, c.state].filter((v) => v !== null && v !== '').join(', ')}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
            {q.trim() !== '' && results.length === 0 ? (
              <Text
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 13,
                  color: MUTED_TEXT,
                  marginTop: 16,
                  textAlign: 'center',
                }}
              >
                Nothing matched. Skip for now and import a course later.
              </Text>
            ) : null}
          </ScrollView>
        </View>
      </View>

      <View style={{ paddingHorizontal: 32, paddingBottom: 32 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            trackEvent('onboarding_skipped_home_course', {});
            router.push('/onboarding/finish');
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
            Skip for now
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
