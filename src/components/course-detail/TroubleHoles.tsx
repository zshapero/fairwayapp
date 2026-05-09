import type { JSX } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ACCENT_GOLD, MUTED_TEXT } from '@/theme/colors';
import type { TroubleHole } from '@/core/db/repositories/courses';

interface TroubleHolesProps {
  holes: TroubleHole[];
  delay?: number;
}

export function TroubleHoles({ holes, delay = 300 }: TroubleHolesProps): JSX.Element | null {
  if (holes.length === 0) return null;
  return (
    <Animated.View entering={FadeInUp.duration(400).delay(delay)}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {holes.map((h) => (
          <View
            key={`trouble-${h.holeNumber}`}
            style={{
              flex: 1,
              borderRadius: 16,
              paddingVertical: 18,
              paddingHorizontal: 12,
              alignItems: 'center',
              backgroundColor: 'rgba(212, 168, 126, 0.20)',
            }}
          >
            <Text
              style={{
                fontFamily: 'Fraunces_600SemiBold',
                fontSize: 32,
                color: '#0F172A',
              }}
            >
              {h.holeNumber}
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 10,
                letterSpacing: 0.8,
                color: MUTED_TEXT,
                textTransform: 'uppercase',
                marginTop: 2,
              }}
            >
              Par {h.par}
            </Text>
            <Text
              style={{
                fontFamily: 'Fraunces_500Medium',
                fontSize: 18,
                color: '#0F172A',
                marginTop: 8,
              }}
            >
              {h.averageScore.toFixed(1)}
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 11,
                color: ACCENT_GOLD,
                marginTop: 2,
              }}
            >
              {`+${h.averageOverPar.toFixed(1)} over par`}
            </Text>
          </View>
        ))}
      </View>
      <Text
        style={{
          fontFamily: 'Inter_400Regular',
          fontStyle: 'italic',
          fontSize: 12,
          color: MUTED_TEXT,
          marginTop: 12,
          textAlign: 'center',
        }}
      >
        These holes have averaged the most strokes over par across your rounds here.
      </Text>
    </Animated.View>
  );
}
