import type { JSX } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Rect } from 'react-native-svg';
import { ACCENT_GOLD, MASTERS_GREEN, MUTED_TEXT } from '@/theme/colors';

function Flag(): JSX.Element {
  // A small minimalist golf flag.
  return (
    <Svg width={120} height={140} viewBox="0 0 120 140">
      {/* Ground */}
      <Rect x={0} y={120} width={120} height={3} fill={MASTERS_GREEN} opacity={0.2} />
      {/* Hole */}
      <Circle cx={60} cy={123} r={6} fill={MASTERS_GREEN} opacity={0.25} />
      {/* Flagpole */}
      <Line
        x1={60}
        y1={120}
        x2={60}
        y2={20}
        stroke={MASTERS_GREEN}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* Flag — gold pennant */}
      <Polygon
        points="60,20 105,32 60,46"
        fill={ACCENT_GOLD}
        opacity={0.85}
      />
    </Svg>
  );
}

export function EmptyState(): JSX.Element {
  return (
    <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 }}>
      <Flag />
      <Text
        style={{
          fontFamily: 'Fraunces_500Medium',
          fontSize: 18,
          color: '#0F172A',
          textAlign: 'center',
          marginTop: 16,
        }}
      >
        Your game looks balanced.
      </Text>
      <Text
        style={{
          fontFamily: 'Inter_400Regular',
          fontSize: 14,
          color: MUTED_TEXT,
          textAlign: 'center',
          marginTop: 6,
          maxWidth: 280,
        }}
      >
        Keep playing and we&apos;ll surface what we see.
      </Text>
    </View>
  );
}
