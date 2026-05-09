import type { JSX } from 'react';
import Svg, { Defs, Filter, FeTurbulence, FeColorMatrix, Rect } from 'react-native-svg';

/**
 * Barely-there paper grain underlay. Rendered behind every round-detail
 * surface so it feels less like an opaque page and more like printed stock.
 * Implementation uses SVG fractal noise at ~2.5% opacity.
 */
export function PaperTexture({
  width,
  height,
  opacity = 0.025,
}: {
  width: number;
  height: number;
  opacity?: number;
}): JSX.Element {
  return (
    <Svg width={width} height={height} pointerEvents="none">
      <Defs>
        <Filter id="paper-noise" x="0" y="0" width="100%" height="100%">
          <FeTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} />
          <FeColorMatrix
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
          />
        </Filter>
      </Defs>
      <Rect
        width={width}
        height={height}
        fill="#000"
        opacity={opacity}
        filter="url(#paper-noise)"
      />
    </Svg>
  );
}
