import { type JSX, useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  /** Border radius. Defaults to 6px (matches Fairway's small-radius idiom). */
  radius?: number;
  /** Override the container style. Useful for spacing without wrapping. */
  style?: ViewStyle;
}

/**
 * Pulsing placeholder for content that's loading. Subtle by design — the
 * goal is "something is on its way" without a generic spinner. Loops at
 * 1.4s per cycle so it never feels frantic.
 *
 * Most data loads in Fairway are synchronous SQLite reads and resolve
 * faster than the eye can perceive — Skeleton is intended for surfaces
 * that touch the network (course search, weather, future cloud sync).
 */
export function Skeleton({
  width = '100%',
  height = 14,
  radius = 6,
  style,
}: SkeletonProps): JSX.Element {
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(opacity);
    };
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * 0.45 + 0.35, // 0.35 → 0.80 range, never fully solid
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: 'rgba(15, 23, 42, 0.08)',
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

/** Quick three-bar skeleton block — useful for list-item placeholders. */
export function SkeletonRow(): JSX.Element {
  return (
    <View style={{ paddingVertical: 12 }}>
      <Skeleton width="60%" height={16} />
      <Skeleton width="40%" height={12} style={{ marginTop: 8 }} />
    </View>
  );
}
