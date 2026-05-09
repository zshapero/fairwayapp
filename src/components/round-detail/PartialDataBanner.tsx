import type { JSX } from 'react';
import { Text, View } from 'react-native';
import { ACCENT_GOLD, ACCENT_GOLD_MUTED } from '@/theme/colors';

export type PartialDataReason = 'no-per-hole' | 'course-missing' | 'tee-missing';

interface PartialDataBannerProps {
  reason?: PartialDataReason;
}

const COPY: Record<PartialDataReason, string> = {
  'no-per-hole':
    "Per-hole data wasn't available for this course. Scores shown are totals only.",
  'course-missing':
    "We couldn't find this round's course in your saved courses. The round is still here.",
  'tee-missing':
    "Tee details aren't available for this round, so some stats may be missing.",
};

export function PartialDataBanner({
  reason = 'no-per-hole',
}: PartialDataBannerProps): JSX.Element {
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
        {COPY[reason]}
      </Text>
    </View>
  );
}
