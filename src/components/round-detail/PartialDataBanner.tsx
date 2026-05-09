import type { JSX } from 'react';
import { Text, View } from 'react-native';
import { ACCENT_GOLD, ACCENT_GOLD_MUTED } from '@/theme/colors';

export function PartialDataBanner(): JSX.Element {
  return (
    <View
      style={{
        marginHorizontal: 20,
        marginTop: 12,
        padding: 12,
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: ACCENT_GOLD,
        backgroundColor: 'rgba(184, 134, 44, 0.08)',
      }}
    >
      <Text
        style={{
          fontFamily: 'Inter_400Regular',
          fontSize: 12,
          lineHeight: 18,
          color: ACCENT_GOLD_MUTED,
        }}
      >
        Per-hole data wasn&apos;t available for this course. Scores shown are
        totals only.
      </Text>
    </View>
  );
}
