import { describe, expect, it } from 'vitest';
import { sanitizeName, validateHandicapInput } from '../inputValidation';

describe('validateHandicapInput', () => {
  it('parses a typical value', () => {
    const r = validateHandicapInput('14.2');
    expect(r.ok).toBe(true);
    expect(r.value).toBe(14.2);
  });

  it('quantizes to one decimal', () => {
    expect(validateHandicapInput('14.27').value).toBe(14.3);
    expect(validateHandicapInput('14.24').value).toBe(14.2);
  });

  it('treats empty input as "not provided" — ok=false with no message', () => {
    expect(validateHandicapInput('')).toEqual({ ok: false, message: '' });
    expect(validateHandicapInput('   ')).toEqual({ ok: false, message: '' });
  });

  it('accepts plus handicaps written with hyphen or unicode minus', () => {
    expect(validateHandicapInput('-1.5').value).toBe(-1.5);
    expect(validateHandicapInput('−2').value).toBe(-2);
  });

  it('rejects non-numeric input with a friendly message', () => {
    const r = validateHandicapInput('abc');
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/number/i);
  });

  it('rejects values below -10', () => {
    expect(validateHandicapInput('-50').ok).toBe(false);
    expect(validateHandicapInput('-50').message).toMatch(/-10/);
  });

  it('rejects values above the WHS max of 54', () => {
    expect(validateHandicapInput('100').ok).toBe(false);
    expect(validateHandicapInput('100').message).toMatch(/54/);
  });

  it('accepts the boundary values exactly', () => {
    expect(validateHandicapInput('-10').ok).toBe(true);
    expect(validateHandicapInput('54').ok).toBe(true);
  });
});

describe('sanitizeName', () => {
  it('trims surrounding whitespace', () => {
    expect(sanitizeName('  Alex  ')).toBe('Alex');
  });

  it('caps overly long names at 60 characters', () => {
    const long = 'A'.repeat(200);
    expect(sanitizeName(long).length).toBe(60);
  });

  it('preserves emoji and special characters within the cap', () => {
    expect(sanitizeName('Álex 🏌️')).toBe('Álex 🏌️');
  });

  it('returns an empty string for a whitespace-only input', () => {
    expect(sanitizeName('   ')).toBe('');
  });
});
