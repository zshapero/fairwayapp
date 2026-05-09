import type { JSX, ReactNode } from 'react';
import { View } from 'react-native';

interface GlassCardProps {
  children: ReactNode;
  /** Extra Tailwind classes appended after the base styles. */
  className?: string;
}

/**
 * Soft, premium card surface used for hero sections. White background, large
 * radius, subtle shadow + ring — designed to feel like glass against the
 * page background rather than a flat box.
 */
export function GlassCard({ children, className }: GlassCardProps): JSX.Element {
  return (
    <View
      className={`rounded-3xl bg-white px-8 py-8 shadow-sm shadow-black/5 ${
        className ?? ''
      }`}
      style={{
        // Soft elevation that survives both iOS shadow and Android elevation.
        shadowColor: '#0F172A',
        shadowOpacity: 0.06,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      }}
    >
      {children}
    </View>
  );
}
