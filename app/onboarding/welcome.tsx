import { router } from 'expo-router';
import { type JSX, useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { trackEvent } from '@/services/analytics';
import { CREAM, MASTERS_GREEN, MUTED_TEXT } from '@/theme/colors';

export default function Welcome(): JSX.Element {
  useEffect(() => {
    trackEvent('onboarding_started', {});
  }, []);
  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: CREAM }}>
      <View style={{ flex: 1, paddingHorizontal: 32, justifyContent: 'center' }}>
        <Text
          style={{
            fontFamily: 'Fraunces_700Bold',
            fontSize: 36,
            color: MASTERS_GREEN,
            letterSpacing: -1,
          }}
        >
          Fairway
        </Text>
        <Text
          style={{
            fontFamily: 'Fraunces_500Medium',
            fontSize: 22,
            lineHeight: 30,
            color: '#0F172A',
            marginTop: 24,
          }}
        >
          A quiet companion for your golf game. Track your handicap, see your patterns,
          and revisit any round.
        </Text>
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 14,
            lineHeight: 21,
            color: MUTED_TEXT,
            marginTop: 14,
          }}
        >
          Three quick steps and you&apos;re in.
        </Text>
      </View>
      <View style={{ paddingHorizontal: 32, paddingBottom: 32 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/onboarding/about-you')}
          style={({ pressed }) => ({
            paddingVertical: 16,
            borderRadius: 14,
            alignItems: 'center',
            backgroundColor: MASTERS_GREEN,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 15, color: 'white' }}>
            Get started
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
