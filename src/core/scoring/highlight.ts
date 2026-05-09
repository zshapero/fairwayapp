export interface HighlightHole {
  holeNumber: number;
  par: number;
  strokes: number | null;
  /** Stroke index, lower = harder. */
  strokeIndex?: number | null;
}

export interface HighlightInput {
  holes: HighlightHole[];
  /** Total gross strokes for the round. */
  grossScore: number;
  /** Player's previous best gross 18-hole score, if known. */
  previousBest?: number | null;
  /** True for 9-hole rounds. */
  nineHole?: boolean;
}

export interface Highlight {
  /** Small uppercase eyebrow label, e.g. "MOMENT". */
  eyebrow: string;
  /** The highlight headline shown in Fraunces. */
  text: string;
}

/** Walks the round and picks the most interesting "moment" to celebrate. */
export function selectHighlight(input: HighlightInput): Highlight {
  const { holes, grossScore, previousBest = null, nineHole = false } = input;

  // 1) Eagle (or better) on any hole.
  const eagleHole = holes.find(
    (h) => h.strokes !== null && h.par - h.strokes >= 2,
  );
  if (eagleHole !== undefined) {
    return {
      eyebrow: 'Moment',
      text: `Eagle on hole ${eagleHole.holeNumber}`,
    };
  }

  // 2) Personal best — broke a previous score.
  if (
    previousBest !== null &&
    grossScore < previousBest &&
    !nineHole
  ) {
    if (previousBest >= 90 && grossScore < 90) {
      return { eyebrow: 'Milestone', text: 'First round under 90!' };
    }
    if (previousBest >= 80 && grossScore < 80) {
      return { eyebrow: 'Milestone', text: 'First round in the 70s!' };
    }
    return { eyebrow: 'Milestone', text: `New personal best: ${grossScore}` };
  }

  // 3) Birdie count.
  const birdies = holes.filter(
    (h) => h.strokes !== null && h.strokes - h.par === -1,
  ).length;
  if (birdies > 0) {
    return {
      eyebrow: 'Moment',
      text: birdies === 1 ? '1 birdie' : `${birdies} birdies`,
    };
  }

  // 4) Par on the toughest hole (lowest stroke index).
  const ranked = [...holes]
    .filter((h) => h.strokes !== null && h.strokeIndex != null)
    .sort((a, b) => (a.strokeIndex ?? 99) - (b.strokeIndex ?? 99));
  const toughest = ranked[0];
  if (toughest !== undefined && toughest.strokes! - toughest.par <= 0) {
    return {
      eyebrow: 'Moment',
      text: `Par on the toughest hole (#${toughest.holeNumber})`,
    };
  }

  // 5) Best single hole relative to par.
  let bestHole: HighlightHole | null = null;
  let bestDiff = Infinity;
  for (const h of holes) {
    if (h.strokes === null) continue;
    const diff = h.strokes - h.par;
    if (diff < bestDiff) {
      bestDiff = diff;
      bestHole = h;
    }
  }
  if (bestHole !== null) {
    const label = bestDiff === 0 ? 'Par' : bestDiff < 0 ? 'Under' : 'Steady';
    return {
      eyebrow: 'Moment',
      text: `${label} on hole ${bestHole.holeNumber}`,
    };
  }

  return { eyebrow: 'Moment', text: 'A round in the books' };
}

/** Counts the holes whose strokes were below par. */
export function countBirdies(holes: HighlightHole[]): number {
  return holes.filter((h) => h.strokes !== null && h.strokes - h.par === -1).length;
}

/** Sum of pars across the holes the player completed. */
export function totalPar(holes: HighlightHole[]): number {
  return holes.reduce((s, h) => s + h.par, 0);
}
