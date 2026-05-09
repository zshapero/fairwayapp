import type { JSX } from 'react';
import { Text, View } from 'react-native';
import Svg, {
  Defs,
  RadialGradient,
  Rect,
  Stop,
  FeTurbulence,
  FeColorMatrix,
  Filter,
} from 'react-native-svg';
import { ACCENT_GOLD, MASTERS_GREEN, MUTED_TEXT } from '@/theme/colors';
import type { Highlight } from '@/core/scoring/highlight';

/** Native canvas dimensions — chosen to render crisply at 1080×1350 in PNG. */
export const SHARE_CANVAS = { width: 1080, height: 1350 } as const;

const CREAM = '#FAF6EE';

export interface ShareableRoundCardProps {
  courseName: string;
  /** "BLUE TEES · 6,420Y" — pre-formatted. */
  teeLabel: string;
  /** "Apr 12, 2026" — pre-formatted. */
  dateLabel: string;
  /** Gross strokes for the round. */
  grossScore: number;
  parTotal: number;
  /** Optional secondary stats. Missing entries are rendered as "—". */
  fairwaysHit?: number | null;
  fairwaysAttempted?: number | null;
  greensInRegulation?: number | null;
  totalGreensAvailable?: number | null;
  putts?: number | null;
  highlight: Highlight;
  /** When true, render a small "9 holes" subtitle under the score. */
  nineHole?: boolean;
}

function relativeToParLabel(diff: number): {
  text: string;
  color: string;
} {
  if (diff === 0) return { text: 'EVEN', color: MUTED_TEXT };
  if (diff < 0) return { text: `${Math.abs(diff)} UNDER`, color: MASTERS_GREEN };
  return { text: `+${diff} OVER`, color: '#A6772E' };
}

function StatCell({
  label,
  value,
  dimmed,
}: {
  label: string;
  value: string;
  dimmed?: boolean;
}): JSX.Element {
  return (
    <View style={{ alignItems: 'center', minWidth: 140 }}>
      <Text
        style={{
          fontFamily: 'Inter_500Medium',
          fontSize: 22,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: dimmed === true ? 'rgba(15,23,42,0.3)' : MUTED_TEXT,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: 'Fraunces_500Medium',
          fontSize: 44,
          color: dimmed === true ? 'rgba(15,23,42,0.4)' : '#0F172A',
          marginTop: 8,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

/**
 * Fixed 1080×1350 portrait composition for capture-and-share.  Designed
 * to look great as an Instagram post / iMessage preview.  The component
 * renders at native dimensions; callers wrap it in a transform to scale
 * for on-screen preview.
 */
export function ShareableRoundCard(props: ShareableRoundCardProps): JSX.Element {
  const {
    courseName,
    teeLabel,
    dateLabel,
    grossScore,
    parTotal,
    fairwaysHit,
    fairwaysAttempted,
    greensInRegulation,
    totalGreensAvailable,
    putts,
    highlight,
    nineHole,
  } = props;

  const diff = grossScore - parTotal;
  const rel = relativeToParLabel(diff);

  const fairwaysValue =
    fairwaysHit !== null &&
    fairwaysHit !== undefined &&
    fairwaysAttempted !== null &&
    fairwaysAttempted !== undefined
      ? `${fairwaysHit}/${fairwaysAttempted}`
      : '—';
  const fairwaysDimmed =
    fairwaysHit === null || fairwaysHit === undefined ||
    fairwaysAttempted === null || fairwaysAttempted === undefined;

  const girValue =
    greensInRegulation !== null &&
    greensInRegulation !== undefined &&
    totalGreensAvailable !== null &&
    totalGreensAvailable !== undefined
      ? `${greensInRegulation}/${totalGreensAvailable}`
      : '—';
  const girDimmed =
    greensInRegulation === null || greensInRegulation === undefined ||
    totalGreensAvailable === null || totalGreensAvailable === undefined;

  const puttsValue = putts !== null && putts !== undefined ? String(putts) : '—';
  const puttsDimmed = putts === null || putts === undefined;

  return (
    <View
      style={{
        width: SHARE_CANVAS.width,
        height: SHARE_CANVAS.height,
        backgroundColor: CREAM,
        overflow: 'hidden',
      }}
    >
      {/* Soft Masters-green radial glow + paper grain overlay */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <Svg
          width={SHARE_CANVAS.width}
          height={SHARE_CANVAS.height}
          viewBox={`0 0 ${SHARE_CANVAS.width} ${SHARE_CANVAS.height}`}
        >
          <Defs>
            <RadialGradient
              id="glow"
              cx="0"
              cy="0"
              rx="0.85"
              ry="0.85"
              fx="0"
              fy="0"
            >
              <Stop offset="0" stopColor={MASTERS_GREEN} stopOpacity={0.08} />
              <Stop offset="1" stopColor={MASTERS_GREEN} stopOpacity={0} />
            </RadialGradient>
            <Filter id="grain" x="0" y="0" width="100%" height="100%">
              <FeTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} />
              <FeColorMatrix
                type="matrix"
                values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              />
            </Filter>
          </Defs>
          <Rect
            width={SHARE_CANVAS.width}
            height={SHARE_CANVAS.height}
            fill="url(#glow)"
          />
          <Rect
            width={SHARE_CANVAS.width}
            height={SHARE_CANVAS.height}
            fill="#000"
            opacity={0.018}
            filter="url(#grain)"
          />
        </Svg>
      </View>

      {/* Top: wordmark + date */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: 80,
          paddingTop: 80,
        }}
      >
        <Text
          style={{
            fontFamily: 'Fraunces_700Bold',
            fontSize: 28,
            letterSpacing: 5.6,
            textTransform: 'uppercase',
            color: MASTERS_GREEN,
          }}
        >
          Fairway
        </Text>
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontStyle: 'italic',
            fontSize: 26,
            color: MUTED_TEXT,
          }}
        >
          {dateLabel}
        </Text>
      </View>

      {/* Course identity */}
      <View style={{ marginTop: 60, paddingHorizontal: 80 }}>
        <Text
          numberOfLines={2}
          ellipsizeMode="tail"
          style={{
            fontFamily: 'Fraunces_500Medium',
            fontSize: 72,
            lineHeight: 84,
            color: '#0F172A',
            letterSpacing: -1,
          }}
        >
          {courseName}
        </Text>
        <View
          style={{
            alignSelf: 'flex-start',
            marginTop: 20,
            paddingHorizontal: 18,
            paddingVertical: 8,
            borderRadius: 999,
            backgroundColor: 'rgba(15, 23, 42, 0.05)',
          }}
        >
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 22,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: MUTED_TEXT,
            }}
          >
            {teeLabel}
          </Text>
        </View>
      </View>

      {/* Hero score */}
      <View style={{ alignItems: 'center', marginTop: 70 }}>
        <Text
          style={{
            fontFamily: 'Fraunces_500Medium',
            fontSize: 280,
            lineHeight: 280,
            color: '#0F172A',
            letterSpacing: -8,
          }}
        >
          {grossScore}
        </Text>
        {nineHole === true ? (
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontStyle: 'italic',
              fontSize: 22,
              color: MUTED_TEXT,
              marginTop: -6,
            }}
          >
            9 holes
          </Text>
        ) : null}
        <Text
          style={{
            fontFamily: 'Inter_500Medium',
            fontSize: 28,
            letterSpacing: 4.2,
            textTransform: 'uppercase',
            color: rel.color,
            marginTop: 8,
          }}
        >
          {rel.text}
        </Text>
        <View
          style={{
            width: 80,
            height: 2,
            backgroundColor: MASTERS_GREEN,
            marginTop: 30,
            borderRadius: 1,
          }}
        />
      </View>

      {/* Stats row */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          paddingHorizontal: 80,
          marginTop: 60,
        }}
      >
        <StatCell label="Gross" value={String(grossScore)} />
        <StatCell label="Fairways" value={fairwaysValue} dimmed={fairwaysDimmed} />
        {puttsDimmed && !girDimmed ? (
          <StatCell label="GIR" value={girValue} dimmed={girDimmed} />
        ) : (
          <StatCell label="Putts" value={puttsValue} dimmed={puttsDimmed} />
        )}
      </View>

      {/* Highlight */}
      <View style={{ alignItems: 'center', marginTop: 80, paddingHorizontal: 80 }}>
        <Text
          style={{
            fontFamily: 'Inter_500Medium',
            fontSize: 22,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: MUTED_TEXT,
          }}
        >
          {highlight.eyebrow}
        </Text>
        <Text
          style={{
            fontFamily: 'Fraunces_500Medium',
            fontSize: 36,
            color: '#0F172A',
            textAlign: 'center',
            marginTop: 12,
          }}
        >
          {highlight.text}
        </Text>
      </View>

      {/* Footer */}
      <View
        style={{
          position: 'absolute',
          bottom: 70,
          left: 0,
          right: 0,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: 'Fraunces_700Bold',
            fontSize: 48,
            color: MASTERS_GREEN,
          }}
        >
          F
        </Text>
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 22,
            color: ACCENT_GOLD,
            opacity: 0.4,
            marginTop: 8,
          }}
        >
          fairway.app
        </Text>
      </View>
    </View>
  );
}
