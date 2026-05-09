import type { JSX, ReactNode } from 'react';
import { Text, View } from 'react-native';
import { ACCENT_GOLD, DIVIDER } from '@/theme/colors';

interface SectionProps {
  label: string;
  children: ReactNode;
}

/** Editorial section: gold eyebrow + divider above the rows. */
export function SettingsSection({ label, children }: SectionProps): JSX.Element {
  return (
    <View style={{ marginTop: 32 }}>
      <Text
        style={{
          fontFamily: 'Inter_500Medium',
          fontSize: 11,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: ACCENT_GOLD,
          marginBottom: 12,
          paddingHorizontal: 24,
        }}
      >
        {label}
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
        {children}
      </View>
    </View>
  );
}
