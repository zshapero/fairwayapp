/**
 * Pure input-validation helpers for free-form numeric fields surfaced in
 * the UI (onboarding, profile edit, etc.). DB-free so they can be unit
 * tested cleanly.
 */

const HANDICAP_MIN = -10;
const HANDICAP_MAX = 54;

export interface ValidationResult<T> {
  ok: boolean;
  /** Parsed value when ok; else undefined. */
  value?: T;
  /** Short, user-facing message when not ok. Empty string when ok. */
  message: string;
}

/**
 * Coerce free-form handicap text into a number. Trims whitespace,
 * accepts a leading minus for plus handicaps, rejects anything outside
 * [-10, 54]. Empty input is treated as "not provided" — callers may
 * skip storage when they get back ok: false with an empty message.
 */
export function validateHandicapInput(raw: string): ValidationResult<number> {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { ok: false, message: '' };
  }
  // Allow Unicode minus sign too, since the formatter uses it.
  const normalized = trimmed.replace(/^[−-]/, '-');
  const n = Number.parseFloat(normalized);
  if (Number.isNaN(n)) {
    return { ok: false, message: 'Enter a number, e.g. 14.2.' };
  }
  if (!Number.isFinite(n)) {
    return { ok: false, message: 'That number looks too big.' };
  }
  if (n < HANDICAP_MIN) {
    return {
      ok: false,
      message: `Handicaps stop around ${HANDICAP_MIN}. Pick a number above that.`,
    };
  }
  if (n > HANDICAP_MAX) {
    return {
      ok: false,
      message: `The WHS max is ${HANDICAP_MAX}. Try a smaller number.`,
    };
  }
  // Quantize to one decimal place — that's the WHS precision.
  return { ok: true, value: Math.round(n * 10) / 10, message: '' };
}

const MAX_NAME_LEN = 60;

/**
 * Trim and bound a user-typed name. Empty string is allowed (caller
 * decides what to do). Caps at 60 characters because anything beyond
 * that breaks every layout we have.
 */
export function sanitizeName(raw: string): string {
  return raw.trim().slice(0, MAX_NAME_LEN);
}
