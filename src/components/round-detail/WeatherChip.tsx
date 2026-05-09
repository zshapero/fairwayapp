import { CloudRain, CloudSnow, CloudSun, Cloud, Sun } from 'phosphor-react-native';
import type { JSX } from 'react';
import { Text, View } from 'react-native';
import { ACCENT_GOLD_MUTED } from '@/theme/colors';
import type { WeatherCondition, WindDirection } from '@/core/db/types';

interface WeatherChipProps {
  temperatureF: number | null;
  windSpeedMph: number | null;
  windDirection: WindDirection | null;
  condition: WeatherCondition | null;
}

const LABELS: Record<WeatherCondition, string> = {
  clear: 'Clear',
  partly_cloudy: 'Partly cloudy',
  cloudy: 'Cloudy',
  rain: 'Rain',
  snow: 'Snow',
};

function IconForCondition({ kind }: { kind: WeatherCondition | null }): JSX.Element {
  const props = { size: 14, color: ACCENT_GOLD_MUTED, weight: 'duotone' as const };
  if (kind === 'clear') return <Sun {...props} />;
  if (kind === 'partly_cloudy') return <CloudSun {...props} />;
  if (kind === 'rain') return <CloudRain {...props} />;
  if (kind === 'snow') return <CloudSnow {...props} />;
  return <Cloud {...props} />;
}

/** Compact weather row for the round-detail hero. Renders nothing if no
 * meaningful data is available. */
export function WeatherChip({
  temperatureF,
  windSpeedMph,
  windDirection,
  condition,
}: WeatherChipProps): JSX.Element | null {
  // Need at least temperature OR a condition to be worth showing.
  if (temperatureF === null && condition === null) return null;

  const parts: string[] = [];
  if (temperatureF !== null) {
    parts.push(`${Math.round(temperatureF)}°`);
  }
  if (windSpeedMph !== null) {
    const dir = windDirection ?? '';
    parts.push(`${Math.round(windSpeedMph)} mph${dir !== '' ? ` ${dir}` : ''}`);
  }
  if (condition !== null) {
    parts.push(LABELS[condition]);
  }

  return (
    <View
      style={{
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <IconForCondition kind={condition} />
      <Text
        style={{
          fontFamily: 'Inter_400Regular',
          fontSize: 12,
          color: ACCENT_GOLD_MUTED,
        }}
      >
        {parts.join(' · ')}
      </Text>
    </View>
  );
}
