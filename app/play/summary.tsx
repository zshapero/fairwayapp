import * as Haptics from 'expo-haptics';
import { Link, router } from 'expo-router';
import { type JSX, useMemo } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDb } from '@/core/db/database';
import { listPlayers } from '@/core/db/repositories/players';
import { listRoundsForPlayer } from '@/core/db/repositories/rounds';
import { trackEvent } from '@/services/analytics';
import { CREAM, MASTERS_GREEN, MUTED_TEXT } from '@/theme/colors';

/**
 * Placeholder round-summary route. The full round-entry flow lives in a
 * future PR — this stub exists so the share trigger has somewhere to
 * live. It surfaces the most recent round and offers Save / Discard /
 * Share affordances.
 */
export default function PlaySummary(): JSX.Element {
  const round = useMemo(() => {
    const db = getDb();
    const player = listPlayers(db)[0];
    if (player === undefined) return null;
    return listRoundsForPlayer(db, player.id)[0] ?? null;
  }, []);

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

        <View style={{ marginTop: 32, gap: 12 }}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (round !== null) {
                trackEvent('round_saved', {
                  numHolesPlayed: round.num_holes_played,
                  grossScore: round.adjusted_gross_score ?? 0,
                  scoreDifferential: round.score_differential,
                });
              }
              router.push('/');
            }}
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
              }}
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
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 15,
                color: '#0F172A',
              }}
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
