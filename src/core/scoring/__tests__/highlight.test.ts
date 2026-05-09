import { describe, expect, it } from 'vitest';
import { countBirdies, selectHighlight, type HighlightHole } from '../highlight';

function hole(
  holeNumber: number,
  par: number,
  strokes: number | null,
  strokeIndex?: number,
): HighlightHole {
  return { holeNumber, par, strokes, strokeIndex };
}

const PAR_72_DEFAULT = Array.from({ length: 18 }, (_, i) => hole(i + 1, 4, 5, i + 1));

describe('selectHighlight', () => {
  it('prefers an eagle when one exists', () => {
    const holes = [...PAR_72_DEFAULT];
    holes[5] = hole(6, 5, 3, 6); // eagle on a par 5
    const h = selectHighlight({ holes, grossScore: 84 });
    expect(h.text).toContain('Eagle on hole 6');
  });

  it('celebrates a sub-90 milestone before counting birdies', () => {
    const holes = [...PAR_72_DEFAULT];
    holes[2] = hole(3, 4, 3, 3); // a birdie
    const h = selectHighlight({
      holes,
      grossScore: 89,
      previousBest: 92,
    });
    expect(h.eyebrow).toBe('Milestone');
    expect(h.text).toBe('First round under 90!');
  });

  it('celebrates entering the 70s', () => {
    const h = selectHighlight({
      holes: PAR_72_DEFAULT,
      grossScore: 79,
      previousBest: 81,
    });
    expect(h.text).toBe('First round in the 70s!');
  });

  it('reports a generic personal best when sub-thresholds do not apply', () => {
    const h = selectHighlight({
      holes: PAR_72_DEFAULT,
      grossScore: 95,
      previousBest: 99,
    });
    expect(h.eyebrow).toBe('Milestone');
    expect(h.text).toContain('New personal best: 95');
  });

  it('counts birdies when no eagle or milestone applies', () => {
    const holes = [...PAR_72_DEFAULT];
    holes[1] = hole(2, 4, 3, 2);
    holes[14] = hole(15, 4, 3, 15);
    const h = selectHighlight({ holes, grossScore: 90 });
    expect(h.text).toBe('2 birdies');
  });

  it('singular birdie copy', () => {
    const holes = [...PAR_72_DEFAULT];
    holes[1] = hole(2, 4, 3, 2);
    const h = selectHighlight({ holes, grossScore: 90 });
    expect(h.text).toBe('1 birdie');
  });

  it('falls back to par on toughest hole', () => {
    const holes = PAR_72_DEFAULT.map((h, i) =>
      i === 0 ? hole(1, 4, 4, 1) : hole(i + 1, 4, 5, i + 1),
    );
    const h = selectHighlight({ holes, grossScore: 89 });
    expect(h.text).toContain('toughest hole');
  });

  it('falls back to best hole relative to par when nothing else applies', () => {
    const holes = PAR_72_DEFAULT.map((h, i) =>
      i === 5 ? hole(6, 4, 4, 6) : hole(i + 1, 4, 5, i + 1),
    );
    const h = selectHighlight({ holes, grossScore: 89 });
    expect(h.text).toContain('hole 6');
  });
});

describe('countBirdies', () => {
  it('counts holes where strokes are exactly one less than par', () => {
    const holes = [hole(1, 4, 3), hole(2, 5, 4), hole(3, 4, 4)];
    expect(countBirdies(holes)).toBe(2);
  });
});
