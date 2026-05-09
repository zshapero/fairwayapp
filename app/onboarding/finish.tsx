import { router } from 'expo-router';
import type { JSX } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDb } from '@/core/db/database';
import {
  listPlayers,
  setOnboardingComplete,
} from '@/core/db/repositories/players';
import { CREAM, MASTERS_GREEN, MUTED_TEXT } from '@/theme/colors';

export default function Finish(): JSX.Element {
  const finish = (): void => {
    const db = getDb();
    const player = listPlayers(db)[0];
    if (player !== undefined) {
      setOnboardingComplete(db, player.id, player.home_course_id);
    }
    router.replace('/');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: CREAM }}>
      <View style={{ flex: 1, paddingHorizontal: 32, justifyContent: 'center' }}>
        <Text
          style={{
            fontFamily: 'Fraunces_500Medium',
            fontSize: 32,
            color: '#0F172A',
            letterSpacing: -0.5,
          }}
        >
          You&apos;re ready.
        </Text>
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 15,
            lineHeight: 22,
            color: MUTED_TEXT,
            marginTop: 12,
          }}
        >
          Tap any time to post a round. Your trend, your courses, and your patterns will
          start filling in as you play.
        </Text>
      </View>
      <View style={{ paddingHorizontal: 32, paddingBottom: 32 }}>
        <Pressable
          accessibilityRole="button"
          onPress={finish}
          style={({ pressed }) => ({
            paddingVertical: 16,
            borderRadius: 14,
            alignItems: 'center',
            backgroundColor: MASTERS_GREEN,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 15, color: 'white' }}>
            Take me to Fairway
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
