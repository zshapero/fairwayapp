import type { JSX } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { DIVIDER, MUTED_TEXT } from '@/theme/colors';

interface SummaryRowProps {
  grossScore: number;
  countedAs: number;
  courseHandicap: number;
  delay?: number;
}

interface Column {
  caption: string;
  value: string;
}

function Cell({ caption, value }: Column): JSX.Element {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}>
      <Text
        style={{
          fontFamily: 'Inter_500Medium',
          fontSize: 10,
          letterSpacing: 1,
          color: MUTED_TEXT,
          textTransform: 'uppercase',
        }}
      >
        {caption}
      </Text>
      <Text
        style={{
          fontFamily: 'Fraunces_600SemiBold',
          fontSize: 28,
          color: '#0F172A',
          marginTop: 6,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export function SummaryRow({
  grossScore,
  countedAs,
  courseHandicap,
  delay = 200,
}: SummaryRowProps): JSX.Element {
  return (
    <Animated.View
      entering={FadeInUp.duration(400).delay(delay)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 24,
      }}
    >
      <Cell caption="Gross score" value={String(grossScore)} />
      <View style={{ width: 0.5, height: 36, backgroundColor: DIVIDER }} />
      <Cell caption="Counted as" value={String(countedAs)} />
      <View style={{ width: 0.5, height: 36, backgroundColor: DIVIDER }} />
      <Cell caption="Course handicap" value={String(courseHandicap)} />
    </Animated.View>
  );
}
