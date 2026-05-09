import type { JSX } from 'react';
import { Text, View } from 'react-native';
import { MASTERS_GREEN, MUTED_TEXT } from '@/theme/colors';
import type { ConfidenceLevel } from './types';

interface PillProps {
  confidence: ConfidenceLevel;
}

function styleFor(c: ConfidenceLevel): {
  background: string;
  border: string;
  text: string;
  label: string;
} {
  if (c === 'high') {
    return {
      background: MASTERS_GREEN,
      border: MASTERS_GREEN,
      text: '#FAF6EC',
      label: 'High confidence',
    };
  }
  if (c === 'moderate') {
    return {
      background: 'transparent',
      border: MASTERS_GREEN,
      text: MASTERS_GREEN,
      label: 'Moderate',
    };
  }
  return {
    background: 'transparent',
    border: 'rgba(15, 23, 42, 0.2)',
    text: MUTED_TEXT,
    label: 'Emerging',
  };
}

export function ConfidencePill({ confidence }: PillProps): JSX.Element {
  const s = styleFor(confidence);
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: s.background,
        borderWidth: 1,
        borderColor: s.border,
      }}
    >
      <Text
        style={{
          fontFamily: 'Inter_500Medium',
          fontSize: 10,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          color: s.text,
        }}
      >
        {s.label}
      </Text>
    </View>
  );
}
