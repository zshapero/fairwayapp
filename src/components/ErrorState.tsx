import type { JSX } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { ACCENT_GOLD, MUTED_TEXT } from '@/theme/colors';

interface ErrorStateProps {
  /** Headline message in Fraunces. Keep it warm and short. */
  message?: string;
  /** Optional secondary explanation. */
  detail?: string;
  /** Pass to surface a Retry button. */
  onRetry?: () => void;
  /** Optional alternative action label. */
  retryLabel?: string;
}

/**
 * Mirrors {@link EmptyState} for the "we couldn't load this" path. Keeps
 * the design language consistent so the user never sees a raw error
 * string. Caller-supplied `onRetry` is the recovery path; if absent, the
 * component renders the message-only variant.
 */
export function ErrorState({
  message = "Couldn't load this.",
  detail,
  onRetry,
  retryLabel = 'Try again',
}: ErrorStateProps): JSX.Element {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 32 }}>
      <Svg width={80} height={80} viewBox="0 0 80 80">
        <Circle cx={40} cy={40} r={28} stroke={ACCENT_GOLD} strokeWidth={1.4} fill="none" />
        <Line x1={40} y1={28} x2={40} y2={44} stroke={ACCENT_GOLD} strokeWidth={2} strokeLinecap="round" />
        <Circle cx={40} cy={52} r={1.5} fill={ACCENT_GOLD} />
      </Svg>
      <Text
        style={{
          fontFamily: 'Fraunces_500Medium',
          fontSize: 18,
          color: '#0F172A',
          marginTop: 14,
          textAlign: 'center',
          lineHeight: 24,
        }}
      >
        {message}
      </Text>
      {detail !== undefined ? (
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 13,
            lineHeight: 19,
            color: MUTED_TEXT,
            marginTop: 6,
            textAlign: 'center',
            maxWidth: 280,
          }}
        >
          {detail}
        </Text>
      ) : null}
      {onRetry !== undefined ? (
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={({ pressed }) => ({
            marginTop: 18,
            paddingVertical: 12,
            paddingHorizontal: 22,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(15, 23, 42, 0.12)',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 14,
              color: '#0F172A',
            }}
          >
            {retryLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
