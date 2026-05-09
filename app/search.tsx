import { Link, router } from 'expo-router';
import { type JSX, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { getDb } from '@/core/db/database';
import { listCourses } from '@/core/db/repositories/courses';
import {
  listRecentSearches,
  recordSearch,
} from '@/core/db/repositories/recentSearches';
import { ACCENT_GOLD, CREAM, DIVIDER, MUTED_TEXT } from '@/theme/colors';

export default function Search(): JSX.Element {
  const [q, setQ] = useState('');
  const allCourses = useMemo(() => listCourses(getDb()), []);
  const [recentNonce, setRecentNonce] = useState(0);
  const recents = useMemo(() => {
    void recentNonce;
    return listRecentSearches(getDb());
  }, [recentNonce]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term === '') return [];
    return allCourses.filter((c) =>
      `${c.club_name} ${c.course_name ?? ''} ${c.city ?? ''} ${c.state ?? ''}`
        .toLowerCase()
        .includes(term),
    );
  }, [allCourses, q]);

  const onSubmit = (): void => {
    if (q.trim() === '') return;
    recordSearch(getDb(), q.trim());
    setRecentNonce((n) => n + 1);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: CREAM }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 8,
        }}
      >
        <Link
          href="/"
          style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: MUTED_TEXT }}
        >
          ← Home
        </Link>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
      >
        <Text
          style={{
            fontFamily: 'Fraunces_700Bold',
            fontSize: 28,
            color: '#0F172A',
          }}
        >
          Find a course
        </Text>

        {/* Recent searches — visible when input is empty. */}
        {q.trim() === '' && recents.length > 0 ? (
          <View style={{ marginTop: 16 }}>
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 11,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: ACCENT_GOLD,
              }}
            >
              Recent searches
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {recents.map((r) => (
                <Pressable
                  key={r.id}
                  accessibilityRole="button"
                  onPress={() => setQ(r.query)}
                  style={({ pressed }) => ({
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: 'rgba(15, 23, 42, 0.04)',
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text
                    style={{
                      fontFamily: 'Inter_500Medium',
                      fontSize: 12,
                      color: MUTED_TEXT,
                    }}
                  >
                    {r.query}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <TextInput
          value={q}
          onChangeText={setQ}
          onSubmitEditing={onSubmit}
          placeholder="Search a course"
          placeholderTextColor="rgba(15, 23, 42, 0.4)"
          style={{
            marginTop: 16,
            fontFamily: 'Inter_500Medium',
            fontSize: 16,
            color: '#0F172A',
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 12,
            backgroundColor: 'rgba(15, 23, 42, 0.04)',
          }}
        />

        <View style={{ marginTop: 16 }}>
          {q.trim() === '' && recents.length === 0 ? (
            <EmptyState
              illustration="search"
              message="Try the name of your course or the city it's in."
            />
          ) : q.trim() !== '' && results.length === 0 ? (
            <EmptyState
              illustration="search"
              message="Nothing matched. Try a different name, or import the course later."
            />
          ) : (
            results.map((c) => {
              const label =
                c.course_name !== null ? `${c.club_name} · ${c.course_name}` : c.club_name;
              return (
                <Pressable
                  key={c.id}
                  accessibilityRole="button"
                  onPress={() => {
                    recordSearch(getDb(), q.trim());
                    setRecentNonce((n) => n + 1);
                    router.push(`/courses/${c.id}`);
                  }}
                  style={({ pressed }) => ({
                    paddingVertical: 14,
                    paddingHorizontal: 8,
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
                      {[c.city, c.state]
                        .filter((v) => v !== null && v !== '')
                        .join(', ')}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

