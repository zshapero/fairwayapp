import * as Haptics from 'expo-haptics';
import { type JSX, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, Text as RNText, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  FeGaussianBlur,
  Filter,
  LinearGradient,
  Line,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { ACCENT_GOLD, GRID, MASTERS_GREEN, MUTED_TEXT } from '@/theme/colors';
import {
  bestIndexPosition,
  buildAreaPath,
  buildLinePath,
  computeYDomain,
  filterByPeriod,
  findClosestPoint,
  formatShortDate,
  gridValues,
  milestoneIndices,
  plotPoints,
  type Period,
  type PlottedPoint,
  type SnapshotPoint,
} from './curve';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedView = Animated.View;

const PADDING = { top: 16, right: 18, bottom: 28, left: 16 };
const Y_LABEL_RIGHT_PAD = 6;
const ENTRY_DURATION_MS = 800;
const SCRUB_FADE_MS = 200;
const PERIOD_MORPH_MS = 350;

interface ChartProps {
  snapshots: SnapshotPoint[];
  height?: number;
  accentColor?: string;
  /** Skip the entry animation (e.g., on subsequent visits to the screen). */
  skipEntry?: boolean;
  period: Period;
}

interface InternalGeometry {
  points: PlottedPoint[];
  linePath: string;
  areaPath: string;
  yDomain: { yMin: number; yMax: number };
  baselineY: number;
  width: number;
}

function buildGeometry(
  data: SnapshotPoint[],
  width: number,
  height: number,
): InternalGeometry {
  const yDomain = computeYDomain(data);
  const viewport = {
    width,
    height,
    paddingTop: PADDING.top,
    paddingBottom: PADDING.bottom,
    paddingLeft: PADDING.left,
    paddingRight: PADDING.right,
  };
  const scales = {
    yMin: yDomain.yMin,
    yMax: yDomain.yMax,
    domainMin: data.length > 0 ? data[0].date : new Date(),
    domainMax: data.length > 0 ? data[data.length - 1].date : new Date(),
  };
  const points = plotPoints(data, viewport, scales);
  const baselineY = height - PADDING.bottom;
  return {
    points,
    linePath: buildLinePath(points),
    areaPath: buildAreaPath(points, baselineY),
    yDomain,
    baselineY,
    width,
  };
}

interface ScrubState {
  visible: boolean;
  point: PlottedPoint | null;
}

export function Chart({
  snapshots,
  height = 180,
  accentColor = MASTERS_GREEN,
  skipEntry = false,
  period,
}: ChartProps): JSX.Element {
  const [width, setWidth] = useState(0);
  const filtered = useMemo(() => filterByPeriod(snapshots, period), [snapshots, period]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  }, []);

  const geometry = useMemo<InternalGeometry | null>(() => {
    if (width === 0 || filtered.length === 0) return null;
    return buildGeometry(filtered, width, height);
  }, [filtered, width, height]);

  // Entry: stroke draws in, gradient fades in.
  const drawProgress = useSharedValue(skipEntry ? 1 : 0);
  // Period morph: fade the path during data changes.
  const morphOpacity = useSharedValue(1);
  // Scrub overlay opacity.
  const scrubOpacity = useSharedValue(0);
  // Scrub line + tooltip x.
  const scrubX = useSharedValue(0);
  const scrubY = useSharedValue(0);

  const [scrub, setScrub] = useState<ScrubState>({ visible: false, point: null });

  // Trigger entry animation once on first render with data.
  const hasAnimatedRef = useRef(skipEntry);
  useEffect(() => {
    if (geometry === null || hasAnimatedRef.current) return;
    drawProgress.value = 0;
    drawProgress.value = withTiming(1, {
      duration: ENTRY_DURATION_MS,
      easing: Easing.out(Easing.cubic),
    });
    hasAnimatedRef.current = true;
  }, [geometry, drawProgress]);

  // Fade transition when the period (and therefore the data) changes.
  const lastPeriodRef = useRef(period);
  useEffect(() => {
    if (lastPeriodRef.current === period) return;
    lastPeriodRef.current = period;
    morphOpacity.value = withTiming(0, { duration: PERIOD_MORPH_MS / 2 }, () => {
      morphOpacity.value = withTiming(1, { duration: PERIOD_MORPH_MS / 2 });
    });
  }, [period, morphOpacity]);

  // Long, generous dasharray so the offset trick works for any path length.
  const DASH_TOTAL = 4000;
  const lineAnimatedProps = useAnimatedProps(() => ({
    strokeDasharray: [DASH_TOTAL, DASH_TOTAL],
    strokeDashoffset: DASH_TOTAL * (1 - drawProgress.value),
    opacity: morphOpacity.value,
  }));
  const fillAnimatedProps = useAnimatedProps(() => ({
    opacity: drawProgress.value * morphOpacity.value,
  }));
  const scrubLineProps = useAnimatedProps(() => ({
    x1: scrubX.value,
    x2: scrubX.value,
    opacity: scrubOpacity.value,
  }));
  const scrubDotProps = useAnimatedProps(() => ({
    cx: scrubX.value,
    cy: scrubY.value,
    opacity: scrubOpacity.value,
  }));
  // Build scrub gesture only when we have geometry.
  const lastPointIndexRef = useRef<number | null>(null);
  const updateScrubFromX = useCallback(
    (x: number) => {
      if (geometry === null) return;
      const closest = findClosestPoint(geometry.points, x);
      if (closest === null) return;
      // Find the index for haptic-on-change.
      const idx = geometry.points.findIndex((p) => p === closest);
      if (lastPointIndexRef.current !== idx) {
        lastPointIndexRef.current = idx;
        Haptics.selectionAsync().catch(() => {
          /* haptics may be unavailable on simulators — ignore. */
        });
      }
      setScrub({ visible: true, point: closest });
    },
    [geometry],
  );

  const endScrub = useCallback(() => {
    setScrub((s) => ({ ...s, visible: false }));
    lastPointIndexRef.current = null;
  }, []);

  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .minDistance(0)
      .onBegin((e) => {
        cancelAnimation(scrubOpacity);
        scrubOpacity.value = withTiming(1, { duration: 100 });
        scrubX.value = e.x;
        runOnJS(updateScrubFromX)(e.x);
      })
      .onUpdate((e) => {
        scrubX.value = e.x;
        runOnJS(updateScrubFromX)(e.x);
      })
      .onFinalize(() => {
        scrubOpacity.value = withTiming(0, { duration: SCRUB_FADE_MS });
        runOnJS(endScrub)();
      });
  }, [scrubOpacity, scrubX, updateScrubFromX, endScrub]);

  // Sync scrubY shared value when the closest point changes.
  useEffect(() => {
    if (scrub.point !== null) {
      scrubY.value = scrub.point.y;
    }
  }, [scrub.point, scrubY]);

  // Date labels: start, middle, end of filtered range.
  const dateLabels = useMemo(() => {
    if (filtered.length === 0) return [];
    const first = filtered[0];
    const last = filtered[filtered.length - 1];
    const mid = filtered[Math.floor(filtered.length / 2)];
    return [first, mid, last].map((s) => formatShortDate(s.date));
  }, [filtered]);

  const annotations = useMemo(() => {
    if (geometry === null) return null;
    const bestIdx = bestIndexPosition(filtered);
    const milestones = milestoneIndices(filtered);
    const lastIdx = filtered.length - 1;
    return {
      best: bestIdx !== null ? geometry.points[bestIdx] : null,
      milestones: milestones.map((i) => geometry.points[i]),
      latest: lastIdx >= 0 ? geometry.points[lastIdx] : null,
    };
  }, [filtered, geometry]);

  return (
    <View onLayout={onLayout} style={{ height }}>
      {geometry !== null && width > 0 ? (
        <>
          <GestureDetector gesture={panGesture}>
            <View style={{ width: '100%', height }}>
              <Svg width={width} height={height}>
                <Defs>
                  <LinearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={accentColor} stopOpacity={0.32} />
                    <Stop offset="1" stopColor={accentColor} stopOpacity={0} />
                  </LinearGradient>
                  <Filter id="trend-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <FeGaussianBlur stdDeviation="8" />
                  </Filter>
                </Defs>

                {/* Horizontal grid lines */}
                {gridValues(geometry.yDomain.yMin, geometry.yDomain.yMax).map((v, i) => {
                  const ratio =
                    (v - geometry.yDomain.yMin) /
                    (geometry.yDomain.yMax - geometry.yDomain.yMin);
                  const y =
                    PADDING.top + ratio * (height - PADDING.top - PADDING.bottom);
                  return (
                    <Line
                      key={`grid-${i}`}
                      x1={PADDING.left}
                      x2={width - PADDING.right}
                      y1={y}
                      y2={y}
                      stroke={GRID}
                      strokeWidth={1}
                      strokeDasharray="2,4"
                    />
                  );
                })}

                {/* Y-axis labels */}
                {gridValues(geometry.yDomain.yMin, geometry.yDomain.yMax).map((v, i) => {
                  const ratio =
                    (v - geometry.yDomain.yMin) /
                    (geometry.yDomain.yMax - geometry.yDomain.yMin);
                  const y =
                    PADDING.top + ratio * (height - PADDING.top - PADDING.bottom);
                  return (
                    <SvgText
                      key={`ylab-${i}`}
                      x={width - PADDING.right - Y_LABEL_RIGHT_PAD}
                      y={y - 3}
                      fontSize={11}
                      fill={MUTED_TEXT}
                      textAnchor="end"
                      fontFamily="Inter_500Medium"
                    >
                      {v.toFixed(1)}
                    </SvgText>
                  );
                })}

                {/* Soft glow under the line */}
                <Path
                  d={geometry.linePath}
                  stroke={accentColor}
                  strokeOpacity={0.12}
                  strokeWidth={8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  filter="url(#trend-glow)"
                />

                {/* Gradient fill */}
                <AnimatedPath
                  d={geometry.areaPath}
                  fill="url(#trend-fill)"
                  animatedProps={fillAnimatedProps}
                />

                {/* Crisp main line */}
                <AnimatedPath
                  d={geometry.linePath}
                  stroke={accentColor}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  animatedProps={lineAnimatedProps}
                />

                {/* Annotations: milestones, best ever, latest. */}
                {annotations?.milestones.map((p, i) => (
                  <Circle
                    key={`milestone-${i}`}
                    cx={p.x}
                    cy={p.y}
                    r={3}
                    fill={accentColor}
                    stroke="white"
                    strokeWidth={1.5}
                  />
                ))}
                {annotations?.best !== null && annotations?.best !== undefined ? (
                  <>
                    <Circle
                      cx={annotations.best.x}
                      cy={annotations.best.y}
                      r={3.5}
                      fill={ACCENT_GOLD}
                      stroke="white"
                      strokeWidth={1.5}
                    />
                    <SvgText
                      x={annotations.best.x}
                      y={annotations.best.y - 8}
                      fontSize={10}
                      fill={ACCENT_GOLD}
                      textAnchor="middle"
                      fontFamily="Fraunces_500Medium"
                    >
                      Best
                    </SvgText>
                  </>
                ) : null}
                {annotations?.latest !== null && annotations?.latest !== undefined ? (
                  <Circle
                    cx={annotations.latest.x}
                    cy={annotations.latest.y}
                    r={4.5}
                    fill={accentColor}
                    stroke="white"
                    strokeWidth={2}
                  />
                ) : null}

                {/* Scrub line */}
                <AnimatedLine
                  y1={PADDING.top}
                  y2={height - PADDING.bottom}
                  stroke={MUTED_TEXT}
                  strokeOpacity={0.3}
                  strokeWidth={1}
                  strokeDasharray="3,3"
                  animatedProps={scrubLineProps}
                />
                {/* Scrub focus dot */}
                <AnimatedCircle
                  r={5}
                  fill="white"
                  stroke={accentColor}
                  strokeWidth={2}
                  animatedProps={scrubDotProps}
                />
              </Svg>
              {scrub.visible && scrub.point !== null ? (
                <ScrubTooltip
                  point={scrub.point}
                  width={width}
                  scrubOpacity={scrubOpacity}
                />
              ) : null}
            </View>
          </GestureDetector>

          {/* Date labels */}
          <View
            className="flex-row justify-between"
            style={{ paddingHorizontal: PADDING.left, marginTop: -16 }}
          >
            {dateLabels.map((label, i) => (
              <RNText
                key={`xlab-${i}`}
                style={{
                  fontSize: 10,
                  color: MUTED_TEXT,
                  fontFamily: 'Inter_400Regular',
                }}
              >
                {label}
              </RNText>
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

interface ScrubTooltipProps {
  point: PlottedPoint;
  width: number;
  scrubOpacity: ReturnType<typeof useSharedValue<number>>;
}

function ScrubTooltip({
  point,
  width,
  scrubOpacity,
}: ScrubTooltipProps): JSX.Element {
  const TOOLTIP_W = 84;
  const TOOLTIP_H = 50;
  const left = Math.min(
    Math.max(point.x - TOOLTIP_W / 2, 4),
    width - TOOLTIP_W - 4,
  );
  const top = Math.max(point.y - TOOLTIP_H - 14, 0);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: scrubOpacity.value,
  }));
  return (
    <AnimatedView
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left,
          top,
          width: TOOLTIP_W,
          paddingVertical: 8,
          paddingHorizontal: 10,
          borderRadius: 12,
          backgroundColor: 'white',
          shadowColor: '#0F172A',
          shadowOpacity: 0.12,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        },
        animatedStyle,
      ]}
    >
      <RNText
        style={{
          fontFamily: 'Inter_500Medium',
          fontSize: 11,
          color: MUTED_TEXT,
        }}
      >
        {formatShortDate(point.date)}
      </RNText>
      <RNText
        style={{
          fontFamily: 'Fraunces_600SemiBold',
          fontSize: 16,
          color: '#0F172A',
          marginTop: 2,
        }}
      >
        {point.index.toFixed(1)}
      </RNText>
    </AnimatedView>
  );
}
