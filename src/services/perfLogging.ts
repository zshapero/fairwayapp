/**
 * Lightweight performance instrumentation. No-ops in production builds;
 * in __DEV__ it logs a warning when a wrapped operation exceeds the
 * threshold (default 500ms).
 *
 * Usage:
 *   const recompute = withPerfLogging('snapshotRecompute', recomputeFn);
 *   recompute(args…);
 *
 * Or for an inline block:
 *   const result = timed('home.load', () => loadHome());
 */

const DEFAULT_WARN_MS = 500;

const isDev = (): boolean =>
  typeof __DEV__ !== 'undefined' ? __DEV__ : false;

interface PerfReport {
  /** Operation name. */
  label: string;
  /** Elapsed milliseconds. */
  elapsedMs: number;
  /** True when elapsedMs >= warnAtMs. */
  warned: boolean;
}

/** Resolve a high-resolution timestamp without leaking the perf API in tests. */
function now(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

let lastReport: PerfReport | null = null;

/**
 * Returns the most recent perf report. Useful for tests; not intended
 * for production code.
 */
export function _getLastPerfReportForTesting(): PerfReport | null {
  return lastReport;
}

export function _resetPerfReportForTesting(): void {
  lastReport = null;
}

function emit(label: string, elapsedMs: number, warnAtMs: number): PerfReport {
  const warned = elapsedMs >= warnAtMs;
  const report: PerfReport = { label, elapsedMs, warned };
  lastReport = report;
  if (!isDev()) return report;
  if (warned) {
    console.warn(
      `[fairway:perf] ${label} took ${elapsedMs.toFixed(0)}ms (>${warnAtMs}ms threshold)`,
    );
  }
  return report;
}

/** Time a synchronous function and emit a report. */
export function timed<T>(
  label: string,
  fn: () => T,
  warnAtMs: number = DEFAULT_WARN_MS,
): T {
  const start = now();
  try {
    const result = fn();
    emit(label, now() - start, warnAtMs);
    return result;
  } catch (e) {
    emit(`${label} (failed)`, now() - start, warnAtMs);
    throw e;
  }
}

/** Time an async function and emit a report when it resolves or rejects. */
export async function timedAsync<T>(
  label: string,
  fn: () => Promise<T>,
  warnAtMs: number = DEFAULT_WARN_MS,
): Promise<T> {
  const start = now();
  try {
    const result = await fn();
    emit(label, now() - start, warnAtMs);
    return result;
  } catch (e) {
    emit(`${label} (failed)`, now() - start, warnAtMs);
    throw e;
  }
}

type AnyFn<Args extends unknown[], R> = (...args: Args) => R;

/**
 * Wrap a function so every call is timed under {@link label}. Preserves
 * the original signature.  Use for functions called from many call sites.
 */
export function withPerfLogging<Args extends unknown[], R>(
  label: string,
  fn: AnyFn<Args, R>,
  warnAtMs: number = DEFAULT_WARN_MS,
): AnyFn<Args, R> {
  return ((...args: Args): R => {
    const start = now();
    try {
      const result = fn(...args);
      // If the wrapped function returned a Promise, attach to the resolution.
      if (
        typeof result === 'object' &&
        result !== null &&
        typeof (result as { then?: unknown }).then === 'function'
      ) {
        (result as unknown as Promise<unknown>).then(
          () => emit(label, now() - start, warnAtMs),
          () => emit(`${label} (failed)`, now() - start, warnAtMs),
        );
        return result;
      }
      emit(label, now() - start, warnAtMs);
      return result;
    } catch (e) {
      emit(`${label} (failed)`, now() - start, warnAtMs);
      throw e;
    }
  }) as AnyFn<Args, R>;
}
