import { type JSX, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { MASTERS_GREEN, MUTED_TEXT } from '@/theme/colors';
import { Chart } from './Chart';
import { defaultPeriod, type Period, type SnapshotPoint } from './curve';

const PERIODS: Period[] = ['30D', '90D', 'All'];

export interface HandicapTrendChartProps {
  snapshots: SnapshotPoint[];
  height?: number;
  accentColor?: string;
  /** Pass true to skip the entry animation (e.g., second screen visit). */
  skipEntry?: boolean;
}

/**
 * Top-level chart with empty / insufficient states and the time-period chips.
 * The actual drawing lives in {@link Chart}.
 */
export function HandicapTrendChart({
  snapshots,
  height = 180,
  accentColor = MASTERS_GREEN,
  skipEntry = false,
}: HandicapTrendChartProps): JSX.Element {
  const initialPeriod = useMemo(() => defaultPeriod(snapshots), [snapshots]);
  const [period, setPeriod] = useState<Period>(initialPeriod);

  // Keep period in sync if the dataset shape changes (e.g., snapshots load).
  useEffect(() => {
    setPeriod(defaultPeriod(snapshots));
  }, [snapshots]);

  if (snapshots.length === 0) {
    return (
      <Text
        className="text-sm"
        style={{ color: MUTED_TEXT, fontFamily: 'Inter_400Regular' }}
      >
        No rounds yet. Your trend will show up here once you start playing.
      </Text>
    );
  }

  if (snapshots.length < 3) {
    return (
      <View className="items-center py-6">
        <Text
          style={{
            color: MUTED_TEXT,
            fontFamily: 'Inter_400Regular',
            textAlign: 'center',
          }}
        >
          Two more rounds and we&apos;ll start showing your trend.
        </Text>
      </View>
    );
  }

  const showChips = snapshots.length >= 10;

  return (
    <View>
      <Chart
        snapshots={snapshots}
        height={height}
        accentColor={accentColor}
        skipEntry={skipEntry}
        period={showChips ? period : 'All'}
      />
      {showChips ? (
        <View className="mt-3 flex-row gap-2">
          {PERIODS.map((p) => {
            const selected = p === period;
            return (
              <Pressable
                key={p}
                onPress={() => setPeriod(p)}
                accessibilityRole="button"
                className="rounded-full px-3 py-1"
                style={{
                  backgroundColor: selected ? `${accentColor}1F` : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Inter_500Medium',
                    fontSize: 12,
                    color: selected ? accentColor : MUTED_TEXT,
                  }}
                >
                  {p}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export type { Period, SnapshotPoint } from './curve';
