import * as Linking from 'expo-linking';
import { Link, router } from 'expo-router';
import type { JSX } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ACCENT_GOLD, CREAM, DIVIDER, MUTED_TEXT } from '@/theme/colors';

function Row({
  label,
  onPress,
  isLast,
}: {
  label: string;
  onPress: () => void;
  isLast?: boolean;
}): JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderBottomWidth: isLast === true ? 0 : 0.5,
        borderBottomColor: DIVIDER,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Text
        style={{
          flex: 1,
          fontFamily: 'Inter_500Medium',
          fontSize: 14,
          color: '#0F172A',
        }}
      >
        {label}
      </Text>
      <Text style={{ fontFamily: 'Inter_500Medium', color: MUTED_TEXT }}>›</Text>
    </Pressable>
  );
}

export default function About(): JSX.Element {
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
          href="/settings"
          style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: MUTED_TEXT }}
        >
          ← Settings
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
          About
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
          <Text
            style={{
              fontFamily: 'Fraunces_700Bold',
              fontSize: 28,
              color: '#0F172A',
              letterSpacing: -0.5,
            }}
          >
            Fairway
          </Text>
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 12,
              color: MUTED_TEXT,
              marginTop: 4,
              letterSpacing: 0.4,
            }}
          >
            Version 1.0.0 · Build 1
          </Text>

          <Text
            style={{
              fontFamily: 'Fraunces_500Medium',
              fontSize: 16,
              lineHeight: 24,
              color: '#0F172A',
              marginTop: 24,
            }}
          >
            A quiet companion for your golf game.
          </Text>
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 14,
              lineHeight: 22,
              color: '#0F172A',
              marginTop: 12,
            }}
          >
            We built Fairway to track your handicap honestly, surface the patterns
            hiding in your scorecard, and stay out of the way the rest of the time.
            No leaderboard, no follower count, no nudges to play more than you
            already do.
          </Text>
          <Text
            style={{
              fontFamily: 'Fraunces_500Medium',
              fontStyle: 'italic',
              fontSize: 15,
              lineHeight: 22,
              color: ACCENT_GOLD,
              marginTop: 14,
            }}
          >
            Made with care for golfers who want to actually improve.
          </Text>
        </View>

        <View style={{ marginTop: 28 }}>
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 11,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              color: ACCENT_GOLD,
              paddingHorizontal: 24,
              marginBottom: 8,
            }}
          >
            Legal
          </Text>
          <View
            style={{
              borderTopWidth: 0.5,
              borderTopColor: DIVIDER,
              borderBottomWidth: 0.5,
              borderBottomColor: DIVIDER,
              backgroundColor: 'rgba(255, 255, 255, 0.45)',
            }}
          >
            <Row
              label="Privacy policy"
              onPress={() => router.push('/settings/legal?tab=privacy')}
            />
            <Row
              label="Terms of service"
              onPress={() => router.push('/settings/legal?tab=terms')}
              isLast
            />
          </View>
        </View>

        <View style={{ marginTop: 28 }}>
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 11,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              color: ACCENT_GOLD,
              paddingHorizontal: 24,
              marginBottom: 8,
            }}
          >
            Contact
          </Text>
          <View
            style={{
              borderTopWidth: 0.5,
              borderTopColor: DIVIDER,
              borderBottomWidth: 0.5,
              borderBottomColor: DIVIDER,
              backgroundColor: 'rgba(255, 255, 255, 0.45)',
            }}
          >
            <Row
              label="hello@fairway.app"
              onPress={() =>
                Linking.openURL('mailto:hello@fairway.app').catch(() => undefined)
              }
              isLast
            />
          </View>
        </View>

        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 11,
            color: MUTED_TEXT,
            textAlign: 'center',
            marginTop: 32,
            paddingHorizontal: 24,
          }}
        >
          Course data via golfcourseapi.com. Weather via open-meteo.com.
        </Text>
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 10,
            color: MUTED_TEXT,
            textAlign: 'center',
            marginTop: 8,
          }}
        >
          ↑ © {new Date().getFullYear()} Fairway
        </Text>
      </ScrollView>

    </SafeAreaView>
  );
}
