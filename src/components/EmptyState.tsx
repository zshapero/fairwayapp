import type { JSX } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Polygon, Rect } from 'react-native-svg';
import { ACCENT_GOLD, MASTERS_GREEN } from '@/theme/colors';

export type EmptyStateIllustration =
  | 'flag'
  | 'tee'
  | 'search'
  | 'calendar'
  | 'list'
  | 'stars';

function Illustration({ kind }: { kind: EmptyStateIllustration }): JSX.Element {
  const w = 80;
  const h = 80;
  const v = `0 0 ${w} ${h}`;
  const accent = MASTERS_GREEN;
  const muted = 'rgba(15, 23, 42, 0.25)';
  switch (kind) {
    case 'flag':
      return (
        <Svg width={w} height={h} viewBox={v}>
          <Line x1={36} y1={68} x2={36} y2={20} stroke={accent} strokeWidth={1.4} />
          <Polygon points="36,20 64,28 36,36" fill={ACCENT_GOLD} opacity={0.85} />
          <Rect x={28} y={68} width={20} height={2} fill={muted} />
        </Svg>
      );
    case 'tee':
      return (
        <Svg width={w} height={h} viewBox={v}>
          <Circle cx={40} cy={26} r={9} fill="#FFFFFF" stroke={accent} strokeWidth={1.4} />
          <Path d="M40 36 L34 64 H46 Z" fill={ACCENT_GOLD} opacity={0.7} />
        </Svg>
      );
    case 'search':
      return (
        <Svg width={w} height={h} viewBox={v}>
          <Circle cx={36} cy={34} r={16} stroke={accent} strokeWidth={2} fill="none" />
          <Line x1={50} y1={48} x2={64} y2={62} stroke={muted} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case 'calendar':
      return (
        <Svg width={w} height={h} viewBox={v}>
          <Rect x={16} y={20} width={48} height={48} rx={6} stroke={accent} strokeWidth={1.4} fill="none" />
          <Line x1={16} y1={32} x2={64} y2={32} stroke={accent} strokeWidth={1.4} />
          <Circle cx={28} cy={46} r={2} fill={ACCENT_GOLD} />
          <Circle cx={40} cy={46} r={2} fill={ACCENT_GOLD} />
          <Circle cx={52} cy={56} r={2} fill={ACCENT_GOLD} />
        </Svg>
      );
    case 'list':
      return (
        <Svg width={w} height={h} viewBox={v}>
          <Line x1={20} y1={26} x2={60} y2={26} stroke={accent} strokeWidth={1.4} />
          <Line x1={20} y1={40} x2={60} y2={40} stroke={muted} strokeWidth={1.4} />
          <Line x1={20} y1={54} x2={60} y2={54} stroke={muted} strokeWidth={1.4} />
        </Svg>
      );
    case 'stars':
      return (
        <Svg width={w} height={h} viewBox={v}>
          <Polygon
            points="40,20 44,32 56,32 46,40 50,52 40,44 30,52 34,40 24,32 36,32"
            fill={ACCENT_GOLD}
            opacity={0.85}
          />
          <Circle cx={20} cy={60} r={2} fill={accent} />
          <Circle cx={60} cy={60} r={2} fill={accent} />
        </Svg>
      );
  }
}

interface EmptyStateProps {
  illustration: EmptyStateIllustration;
  message: string;
  cta?: { label: string; onPress: () => void };
}

export function EmptyState({ illustration, message, cta }: EmptyStateProps): JSX.Element {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 32 }}>
      <Illustration kind={illustration} />
      <Text
        style={{
          fontFamily: 'Fraunces_500Medium',
          fontSize: 18,
          color: '#0F172A',
          marginTop: 14,
          textAlign: 'center',
          lineHeight: 24,
        }}
      >
        {message}
      </Text>
      {cta !== undefined ? (
        <Pressable
          accessibilityRole="button"
          onPress={cta.onPress}
          style={({ pressed }) => ({
            marginTop: 18,
            paddingVertical: 12,
            paddingHorizontal: 22,
            borderRadius: 12,
            backgroundColor: MASTERS_GREEN,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 14,
              color: 'white',
            }}
          >
            {cta.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

