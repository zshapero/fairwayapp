import { describe, expect, it } from 'vitest';
import { classifyScore, formatToPar, visualForScore } from '../relativeToPar';

describe('classifyScore', () => {
  it('classifies par-4 results across the full range', () => {
    expect(classifyScore(2, 4)).toBe('eagle-or-better');
    expect(classifyScore(1, 4)).toBe('eagle-or-better');
    expect(classifyScore(3, 4)).toBe('birdie');
    expect(classifyScore(4, 4)).toBe('par');
    expect(classifyScore(5, 4)).toBe('bogey');
    expect(classifyScore(6, 4)).toBe('double-bogey');
    expect(classifyScore(7, 4)).toBe('triple-or-worse');
    expect(classifyScore(9, 4)).toBe('triple-or-worse');
  });

  it('classifies hole-out par-3s as eagle (or albatross-equivalent)', () => {
    expect(classifyScore(1, 3)).toBe('eagle-or-better');
  });

  it('classifies par-5 albatross', () => {
    expect(classifyScore(2, 5)).toBe('eagle-or-better');
  });
});

describe('visualForScore', () => {
  it('par renders without a background and without bolder weight', () => {
    const v = visualForScore('par');
    expect(v.background).toBe('');
    expect(v.bolder).toBe(false);
  });
  it('birdie and eagle render bolder weight', () => {
    expect(visualForScore('birdie').bolder).toBe(true);
    expect(visualForScore('eagle-or-better').bolder).toBe(true);
  });
  it('every non-par class has a non-empty background', () => {
    for (const c of [
      'eagle-or-better',
      'birdie',
      'bogey',
      'double-bogey',
      'triple-or-worse',
    ] as const) {
      expect(visualForScore(c).background).not.toBe('');
    }
  });
});

describe('formatToPar', () => {
  it('formats positive, zero, and negative diffs', () => {
    expect(formatToPar(0)).toBe('E');
    expect(formatToPar(5)).toBe('+5');
    expect(formatToPar(-2)).toBe('−2');
  });
});
