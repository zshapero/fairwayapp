import type { JSX } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ACCENT_GOLD, DIVIDER, MASTERS_GREEN, MUTED_TEXT } from '@/theme/colors';
import { SectionHeading } from './SectionHeading';

interface HandicapMovementCardProps {
  /** Index immediately before this round was recorded. */
  before: number | null;
  /** Index after this round was applied. */
  after: number | null;
  /** Score Differential of this round. */
  differential: number | null;
  /** True if this round's differential is among the lowest-N currently used. */
  countedTowardIndex: boolean;
  delay?: number;
}

interface StatProps {
  label: string;
  value: string;
  color?: string;
}

function Stat({ label, value, color = '#0F172A' }: StatProps): JSX.Element {
  return (
    <View style={{ flex: 1, alignItems: 'flex-start' }}>
      <Text
        style={{
          fontFamily: 'Inter_500Medium',
          fontSize: 10,
          letterSpacing: 1,
          color: MUTED_TEXT,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: 'Fraunces_600SemiBold',
          fontSize: 22,
          color,
          marginTop: 6,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function formatIndex(v: number | null): string {
  return v === null ? '—' : v.toFixed(1);
}

export function HandicapMovementCard({
  before,
  after,
  differential,
  countedTowardIndex,
  delay = 600,
}: HandicapMovementCardProps): JSX.Element {
  const delta = before !== null && after !== null ? after - before : null;
  const deltaText =
    delta === null
      ? '—'
      : delta === 0
        ? 'No change'
        : `${delta < 0 ? '↓' : '↑'} ${Math.abs(delta).toFixed(1)}`;
  const deltaColor =
    delta === null
      ? MUTED_TEXT
      : delta <= 0
        ? MASTERS_GREEN
        : ACCENT_GOLD;

  return (
    <Animated.View entering={FadeInUp.duration(400).delay(delay)}>
      <SectionHeading label="Impact on your index" />
      <View
        style={{
          marginTop: 16,
          padding: 20,
          borderRadius: 16,
          borderWidth: 0.5,
          borderColor: DIVIDER,
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
        }}
      >
        <View style={{ flexDirection: 'row' }}>
          <Stat label="Before" value={formatIndex(before)} />
          <Stat label="After" value={formatIndex(after)} />
          <Stat label="Change" value={deltaText} color={deltaColor} />
        </View>
        <View style={{ height: 1, backgroundColor: DIVIDER, marginVertical: 16 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Stat
            label="Differential"
            value={differential !== null ? differential.toFixed(1) : '—'}
          />
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 10,
                letterSpacing: 1,
                color: MUTED_TEXT,
                textTransform: 'uppercase',
              }}
            >
              Counted
            </Text>
            <Text
              style={{
                fontFamily: 'Fraunces_500Medium',
                fontSize: 16,
                color: countedTowardIndex ? MASTERS_GREEN : MUTED_TEXT,
                marginTop: 6,
              }}
            >
              {countedTowardIndex ? 'Yes' : 'Not in use'}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
