import type { JSX } from 'react';
import { Text, View } from 'react-native';
import { ACCENT_GOLD, DIVIDER } from '@/theme/colors';
import { GlassCard } from '../GlassCard';
import { RoundCard, type RoundCardData } from './RoundCard';

interface RoundsLatelyProps {
  rounds: RoundCardData[];
}

export function RoundsLately({ rounds }: RoundsLatelyProps): JSX.Element | null {
  if (rounds.length === 0) return null;
  return (
    <View style={{ marginTop: 20 }}>
      <Text
        style={{
          fontFamily: 'Inter_500Medium',
          fontSize: 12,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: ACCENT_GOLD,
          marginLeft: 24,
          marginBottom: 8,
        }}
      >
        Lately
      </Text>
      <GlassCard className="px-0 py-0">
        <View>
          {rounds.map((r, i) => (
            <View
              key={r.id}
              style={{
                borderBottomWidth: i === rounds.length - 1 ? 0 : 0.5,
                borderBottomColor: DIVIDER,
              }}
            >
              <RoundCard round={r} />
            </View>
          ))}
        </View>
      </GlassCard>
    </View>
  );
}
