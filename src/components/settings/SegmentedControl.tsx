import type { JSX } from 'react';
import { Pressable, Text, View } from 'react-native';
import { DIVIDER, MASTERS_GREEN, MUTED_TEXT } from '@/theme/colors';

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>): JSX.Element {
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: 'rgba(15, 23, 42, 0.04)',
        borderRadius: 999,
        padding: 2,
        borderWidth: 0.5,
        borderColor: DIVIDER,
      }}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            onPress={() => onChange(opt.value)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: selected ? 'white' : 'transparent',
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 12,
                color: selected ? MASTERS_GREEN : MUTED_TEXT,
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
