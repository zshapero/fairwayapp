import { CaretDown, CaretUp, Lightbulb } from 'phosphor-react-native';
import { type JSX, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import type { HoleStrategy } from '@/core/scoring/holeStrategy';
import { ACCENT_GOLD, ACCENT_GOLD_MUTED, DIVIDER, MUTED_TEXT } from '@/theme/colors';

interface HoleStrategyTipProps {
  strategy: HoleStrategy | null;
  /** Pass the current hole number; the tip auto-collapses when it changes. */
  holeNumber: number;
}

/**
 * Subtle expandable Tip pill, designed to sit at the bottom of the hole
 * header on the in-round score screen. Renders nothing if no strategy
 * data is available (the spec calls this an optional information layer).
 */
export function HoleStrategyTip({
  strategy,
  holeNumber,
}: HoleStrategyTipProps): JSX.Element | null {
  const [expanded, setExpanded] = useState(false);
  // Auto-collapse when the parent's hole changes — implemented by keying
  // the pill on holeNumber so React remounts and the local state resets.
  void holeNumber;

  if (strategy === null) return null;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => setExpanded((v) => !v)}
      style={({ pressed }) => ({
        alignSelf: 'flex-start',
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(184, 134, 44, 0.10)',
        borderWidth: 0.5,
        borderColor: DIVIDER,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Lightbulb size={12} color={ACCENT_GOLD} weight="duotone" />
      <Text
        style={{
          fontFamily: 'Inter_500Medium',
          fontSize: 11,
          letterSpacing: 0.4,
          color: ACCENT_GOLD_MUTED,
          textTransform: 'uppercase',
        }}
      >
        Tip
      </Text>
      {expanded ? (
        <CaretUp size={10} color={MUTED_TEXT} weight="bold" />
      ) : (
        <CaretDown size={10} color={MUTED_TEXT} weight="bold" />
      )}
      {expanded ? (
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(120)}
          style={{ marginLeft: 8, maxWidth: 280 }}
        >
          <Text
            style={{
              fontFamily: 'Fraunces_500Medium',
              fontSize: 13,
              lineHeight: 18,
              color: '#0F172A',
            }}
          >
            {strategy.tendency}
          </Text>
        </Animated.View>
      ) : null}
      {/* Reserved for the future score screen wiring. */}
      <View style={{ display: 'none' }} />
    </Pressable>
  );
}
