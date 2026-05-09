import { LinearGradient } from 'expo-linear-gradient';
import type { JSX } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ACCENT_GOLD_MUTED, CREAM, MUTED_TEXT } from '@/theme/colors';
import type { WeatherCondition, WindDirection } from '@/core/db/types';
import { WeatherChip } from './WeatherChip';

interface HeroHeaderProps {
  courseName: string;
  playedAt: Date;
  teePillText: string;
  weather?: {
    temperatureF: number | null;
    windSpeedMph: number | null;
    windDirection: WindDirection | null;
    condition: WeatherCondition | null;
  };
}

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function formatPlayedAt(date: Date): string {
  return `Played ${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

/**
 * Hero header for the round-detail screen. Soft gradient masquerading as a
 * blurred course photo (we don't store course imagery yet — this is the
 * generic fallback). Course name in Fraunces, italic muted date below, and
 * a small gold tee pill.
 */
export function HeroHeader({
  courseName,
  playedAt,
  teePillText,
  weather,
}: HeroHeaderProps): JSX.Element {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={{ paddingVertical: 64 }}>
      {/* Background gradient — placeholder for the eventual course photo. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
        }}
      >
        <LinearGradient
          colors={['#5A7A4F', '#3E5C39', CREAM]}
          locations={[0, 0.55, 1]}
          style={{ flex: 1, opacity: 0.14 }}
        />
      </View>

      <View style={{ alignItems: 'center', paddingHorizontal: 24 }}>
        <Text
          allowFontScaling
          style={{
            fontFamily: 'Fraunces_500Medium',
            fontSize: 36,
            lineHeight: 42,
            color: '#0F172A',
            textAlign: 'center',
            letterSpacing: -0.5,
          }}
        >
          {courseName}
        </Text>
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontStyle: 'italic',
            fontSize: 14,
            color: MUTED_TEXT,
            marginTop: 8,
          }}
        >
          {formatPlayedAt(playedAt)}
        </Text>
        <View
          style={{
            marginTop: 16,
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: 999,
            backgroundColor: 'rgba(184, 134, 44, 0.12)',
          }}
        >
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 12,
              color: ACCENT_GOLD_MUTED,
              letterSpacing: 0.4,
            }}
          >
            {teePillText}
          </Text>
        </View>
        {weather !== undefined ? (
          <WeatherChip
            temperatureF={weather.temperatureF}
            windSpeedMph={weather.windSpeedMph}
            windDirection={weather.windDirection}
            condition={weather.condition}
          />
        ) : null}
      </View>
    </Animated.View>
  );
}
