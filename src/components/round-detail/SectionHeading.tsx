import type { JSX } from 'react';
import { Text, View } from 'react-native';
import { ACCENT_GOLD, DIVIDER } from '@/theme/colors';

/** Editorial section heading: hairline divider, gold all-caps eyebrow. */
export function SectionHeading({ label }: { label: string }): JSX.Element {
  return (
    <View>
      <View style={{ height: 1, backgroundColor: DIVIDER, marginBottom: 16 }} />
      <Text
        style={{
          fontFamily: 'Inter_500Medium',
          fontSize: 12,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: ACCENT_GOLD,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
