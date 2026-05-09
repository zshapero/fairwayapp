import * as Haptics from 'expo-haptics';
import { type JSX, useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { GlassCard } from '@/components/GlassCard';
import { ACCENT_GOLD, MASTERS_GREEN, MUTED_TEXT } from '@/theme/colors';
import { ConfidencePill } from './ConfidencePill';
import type { Recommendation } from './types';

interface RecommendationCardProps {
  recommendation: Recommendation;
  practicedToday: boolean;
  onPracticed: () => void;
}

/**
 * Polished card. Opportunities use a Masters-green left accent; strengths
 * and milestones use a soft gold left border. The "Practiced today"
 * button sweeps a subtle gold gradient on tap, then settles back.
 */
export function RecommendationCard({
  recommendation,
  practicedToday,
  onPracticed,
}: RecommendationCardProps): JSX.Element {
  const [logged, setLogged] = useState(practicedToday);
  const sweep = useSharedValue(0);

  const onPress = useCallback(() => {
    Haptics.selectionAsync().catch(() => {
      /* haptics unavailable — ignore */
    });
    sweep.value = withTiming(1, { duration: 280 }, () => {
      sweep.value = withTiming(0, { duration: 380 });
    });
    setLogged(true);
    onPracticed();
  }, [sweep, onPracticed]);

  const sweepStyle = useAnimatedStyle(() => ({
    opacity: sweep.value * 0.55,
    transform: [{ translateX: -100 + sweep.value * 240 }],
  }));

  const isOpp = recommendation.kind === 'opportunity';
  const accentColor = isOpp ? MASTERS_GREEN : ACCENT_GOLD;

  return (
    <View style={{ marginTop: 12 }}>
      <GlassCard className="px-0 py-0">
        <View
          style={{
            flexDirection: 'row',
            paddingVertical: 18,
            paddingRight: 20,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: 3,
              backgroundColor: accentColor,
              marginRight: 17,
            }}
          />
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text
                style={{
                  fontFamily: 'Inter_500Medium',
                  fontSize: 10,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: MUTED_TEXT,
                }}
              >
                {recommendation.kind === 'opportunity'
                  ? 'Opportunity'
                  : recommendation.kind === 'strength'
                    ? 'Strength'
                    : 'Milestone'}
              </Text>
              {isOpp && recommendation.confidence !== undefined ? (
                <ConfidencePill confidence={recommendation.confidence} />
              ) : null}
            </View>
            <Text
              style={{
                fontFamily: 'Fraunces_600SemiBold',
                fontSize: 18,
                color: '#0F172A',
                marginTop: 4,
              }}
            >
              {recommendation.title}
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 13,
                lineHeight: 19,
                color: '#0F172A',
                marginTop: 6,
              }}
            >
              {recommendation.body}
            </Text>
            {recommendation.suggestion !== undefined ? (
              <Text
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontStyle: 'italic',
                  fontSize: 12,
                  color: MUTED_TEXT,
                  marginTop: 6,
                }}
              >
                {recommendation.suggestion}
              </Text>
            ) : null}

            {isOpp ? (
              <Pressable
                accessibilityRole="button"
                onPress={onPress}
                style={({ pressed }) => ({
                  marginTop: 14,
                  alignSelf: 'flex-start',
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: logged
                    ? 'rgba(11, 107, 58, 0.12)'
                    : 'rgba(15, 23, 42, 0.04)',
                  opacity: pressed ? 0.7 : 1,
                  overflow: 'hidden',
                })}
              >
                <Animated.View
                  pointerEvents="none"
                  style={[
                    {
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      width: 80,
                      backgroundColor: ACCENT_GOLD,
                    },
                    sweepStyle,
                  ]}
                />
                <Text
                  style={{
                    fontFamily: 'Inter_500Medium',
                    fontSize: 12,
                    color: logged ? MASTERS_GREEN : '#0F172A',
                  }}
                >
                  {logged ? 'Practiced ✓' : 'Practiced today'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </GlassCard>
    </View>
  );
}
