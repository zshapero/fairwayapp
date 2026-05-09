import { router } from 'expo-router';
import type { JSX } from 'react';
import { Text, View } from 'react-native';
import { ACCENT_GOLD, DIVIDER } from '@/theme/colors';
import { EmptyState } from '../EmptyState';
import { GlassCard } from '../GlassCard';
import { RoundCard, type RoundCardData } from './RoundCard';

interface RoundsLatelyProps {
  rounds: RoundCardData[];
}

export function RoundsLately({ rounds }: RoundsLatelyProps): JSX.Element {
  if (rounds.length === 0) {
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
          <EmptyState
            illustration="tee"
            message="Your rounds will land here."
            cta={{
              label: 'Post your first round',
              onPress: () => router.push('/play/summary'),
            }}
          />
        </GlassCard>
      </View>
    );
  }
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
