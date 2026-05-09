import type { JSX } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { CREAM_CARD, GRID, MUTED_TEXT } from '@/theme/colors';
import { classifyScore, visualForScore } from '@/core/scoring/relativeToPar';
import { PaperTexture } from './PaperTexture';
import { buildScorecard, type HoleData } from './scorecardData';

export type { HoleData, ScorecardComputed } from './scorecardData';
export { buildScorecard } from './scorecardData';

interface ScorecardProps {
  holes: HoleData[];
  /** When true, render only the front 9 (used for 9-hole rounds). */
  nineHoleOnly?: boolean;
}

/** Sum the strokes for a slice of holes, treating nulls as zero. */
function totalStrokes(holes: HoleData[]): number {
  return holes.reduce((sum, h) => sum + (h.strokes ?? 0), 0);
}

function HeaderCell({ label }: { label: string }): JSX.Element {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text
        style={{
          fontFamily: 'Inter_500Medium',
          fontSize: 11,
          letterSpacing: 0.88,
          color: MUTED_TEXT,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function HoleCell({
  hole,
  totalEmphasis,
  rowLabel,
}: {
  hole: HoleData | null;
  totalEmphasis?: { value: number; label: string };
  rowLabel?: string;
}): JSX.Element {
  // Total / row-label cell
  if (hole === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
        {rowLabel !== undefined ? (
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 11,
              color: MUTED_TEXT,
              letterSpacing: 0.88,
              textTransform: 'uppercase',
            }}
          >
            {rowLabel}
          </Text>
        ) : null}
        {totalEmphasis !== undefined ? (
          <>
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 9,
                color: MUTED_TEXT,
                marginTop: 2,
              }}
            >
              {totalEmphasis.label}
            </Text>
            <Text
              style={{
                fontFamily: 'Fraunces_600SemiBold',
                fontSize: 20,
                color: '#0F172A',
                marginTop: 4,
              }}
            >
              {totalEmphasis.value}
            </Text>
          </>
        ) : null}
      </View>
    );
  }
  const klass = hole.strokes !== null ? classifyScore(hole.strokes, hole.par) : 'par';
  const visual = visualForScore(klass);
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
      <Text
        style={{
          fontFamily: 'Inter_500Medium',
          fontSize: 11,
          color: MUTED_TEXT,
        }}
      >
        {hole.par}
      </Text>
      <Text
        style={{
          fontFamily: 'Inter_400Regular',
          fontSize: 9,
          color: MUTED_TEXT,
          marginTop: 2,
        }}
      >
        {hole.yardage !== null ? hole.yardage : '—'}
      </Text>
      <View
        style={{
          marginTop: 6,
          width: 28,
          height: 28,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 14,
          backgroundColor: visual.background === '' ? 'transparent' : visual.background,
        }}
      >
        <Text
          style={{
            fontFamily: visual.bolder ? 'Fraunces_600SemiBold' : 'Fraunces_500Medium',
            fontSize: 18,
            color: '#0F172A',
          }}
        >
          {hole.strokes ?? '—'}
        </Text>
      </View>
    </View>
  );
}

interface RowProps {
  holes: HoleData[];
  rowLabel: string;
  totalLabel: string;
  delay: number;
}

function ScorecardHeaderRow({ holes }: { holes: HoleData[] }): JSX.Element {
  return (
    <View style={{ flexDirection: 'row', paddingVertical: 6 }}>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text
          style={{
            fontFamily: 'Inter_500Medium',
            fontSize: 11,
            letterSpacing: 0.88,
            color: MUTED_TEXT,
            textTransform: 'uppercase',
          }}
        >
          Hole
        </Text>
      </View>
      {holes.map((h) => (
        <HeaderCell key={`hdr-${h.holeNumber}`} label={String(h.holeNumber)} />
      ))}
      <HeaderCell label="" />
    </View>
  );
}

function ScorecardRow({ holes, rowLabel, totalLabel, delay }: RowProps): JSX.Element {
  return (
    <Animated.View
      entering={FadeInUp.duration(400).delay(delay)}
      style={{
        flexDirection: 'row',
        borderTopWidth: 0.5,
        borderTopColor: GRID,
      }}
    >
      <HoleCell hole={null} rowLabel={rowLabel} />
      {holes.map((h) => (
        <HoleCell key={`cell-${h.holeNumber}`} hole={h} />
      ))}
      <HoleCell
        hole={null}
        totalEmphasis={{ value: totalStrokes(holes), label: totalLabel }}
      />
    </Animated.View>
  );
}

export function Scorecard({
  holes,
  nineHoleOnly = false,
}: ScorecardProps): JSX.Element {
  const built = buildScorecard(holes, nineHoleOnly ? 9 : 18);
  return (
    <View
      style={{
        backgroundColor: CREAM_CARD,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 14,
        overflow: 'hidden',
      }}
    >
      {/* Paper texture underlay */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        {/* Width is unknown at static render; PaperTexture's SVG scales to the View. */}
        <PaperTexture width={1000} height={400} opacity={0.025} />
      </View>

      <ScorecardHeaderRow holes={built.front} />
      <ScorecardRow holes={built.front} rowLabel="F9" totalLabel="OUT" delay={300} />

      {!built.nineHoleOnly ? (
        <>
          <View style={{ height: 8 }} />
          <ScorecardHeaderRow holes={built.back} />
          <ScorecardRow holes={built.back} rowLabel="B9" totalLabel="IN" delay={400} />
          {/* Grand total row */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(450)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingVertical: 10,
              borderTopWidth: 0.5,
              borderTopColor: GRID,
              marginTop: 4,
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 11,
                letterSpacing: 0.88,
                color: MUTED_TEXT,
                textTransform: 'uppercase',
                marginRight: 12,
              }}
            >
              Total
            </Text>
            <Text
              style={{
                fontFamily: 'Fraunces_600SemiBold',
                fontSize: 22,
                color: '#0F172A',
              }}
            >
              {built.totalStrokes}
            </Text>
          </Animated.View>
        </>
      ) : null}
    </View>
  );
}
