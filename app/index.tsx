import { Link, useFocusEffect } from 'expo-router';
import { type JSX, useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '@/components/GlassCard';
import { HandicapTrendChart } from '@/components/HandicapTrendChart';
import { generateDemoTrend } from '@/components/home/demoTrend';
import { ACCENT_GOLD, MASTERS_GREEN, MUTED_TEXT } from '@/theme/colors';

const HOUR_GREETINGS: { from: number; text: string }[] = [
  { from: 0, text: 'Good evening' },
  { from: 5, text: 'Good morning' },
  { from: 12, text: 'Good afternoon' },
  { from: 18, text: 'Good evening' },
];

function greetingForHour(hour: number): string {
  let pick = HOUR_GREETINGS[0];
  for (const slot of HOUR_GREETINGS) {
    if (hour >= slot.from) pick = slot;
  }
  return pick.text;
}

export default function Home(): JSX.Element {
  const snapshots = useMemo(() => generateDemoTrend(), []);
  const latest = snapshots[snapshots.length - 1];
  const prior = snapshots[snapshots.length - 2];
  const delta = latest && prior ? latest.index - prior.index : 0;
  const greeting = greetingForHour(new Date().getHours());

  // Replay the entry animation only on the first focus of this session.
  const hasFocusedRef = useRef(false);
  const [skipEntry, setSkipEntry] = useState(false);
  useFocusEffect(
    useCallback(() => {
      if (hasFocusedRef.current) {
        setSkipEntry(true);
      } else {
        hasFocusedRef.current = true;
        setSkipEntry(false);
      }
    }, []),
  );

  const deltaText =
    delta === 0
      ? 'No change from last round'
      : `${delta < 0 ? '↓' : '↑'} ${Math.abs(delta).toFixed(1)} from last round`;
  const deltaColor = delta <= 0 ? MASTERS_GREEN : ACCENT_GOLD;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#F5F5F2' }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <GlassCard className="px-0 py-0">
          <View className="px-8 pt-8">
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 14,
                color: MUTED_TEXT,
                letterSpacing: 0.4,
              }}
            >
              {greeting.toUpperCase()}
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 14,
                color: MUTED_TEXT,
                marginTop: 4,
              }}
            >
              Your handicap index, tracking quietly.
            </Text>

            <View style={{ marginTop: 18, alignItems: 'flex-start' }}>
              <Text
                style={{
                  fontFamily: 'Fraunces_700Bold',
                  fontSize: 88,
                  lineHeight: 96,
                  color: '#0F172A',
                  letterSpacing: -2,
                }}
              >
                {latest.index.toFixed(1)}
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter_500Medium',
                  fontSize: 13,
                  color: deltaColor,
                  marginTop: 4,
                }}
              >
                {deltaText}
              </Text>
            </View>
          </View>

          <View className="mt-4 px-8">
            <HandicapTrendChart snapshots={snapshots} skipEntry={skipEntry} />
          </View>

          <View className="mt-6 px-8 pb-8">
            <Link
              href="/debug"
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 13,
                color: MUTED_TEXT,
              }}
            >
              Debug →
            </Link>
          </View>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}
