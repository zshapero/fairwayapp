import { afterEach, describe, expect, it } from 'vitest';
import {
  _getLastPerfReportForTesting,
  _resetPerfReportForTesting,
  timed,
  timedAsync,
  withPerfLogging,
} from '../perfLogging';

afterEach(() => {
  _resetPerfReportForTesting();
});

describe('timed', () => {
  it('runs the synchronous function and reports elapsed time', () => {
    const result = timed('sum', () => 1 + 2);
    expect(result).toBe(3);
    const report = _getLastPerfReportForTesting();
    expect(report?.label).toBe('sum');
    expect(report?.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it('still emits a report when the function throws and re-throws the error', () => {
    expect(() =>
      timed('boom', () => {
        throw new Error('nope');
      }),
    ).toThrow('nope');
    const report = _getLastPerfReportForTesting();
    expect(report?.label).toBe('boom (failed)');
  });

  it('marks reports above the threshold as warned', () => {
    timed(
      'slow',
      () => {
        // Busy-wait long enough to cross the threshold deterministically.
        const stop = Date.now() + 30;
        while (Date.now() < stop) {
          /* spin */
        }
      },
      10,
    );
    const report = _getLastPerfReportForTesting();
    expect(report?.warned).toBe(true);
    expect(report?.elapsedMs).toBeGreaterThanOrEqual(10);
  });

  it('does not warn for fast operations under the threshold', () => {
    timed('fast', () => 'ok', 1000);
    expect(_getLastPerfReportForTesting()?.warned).toBe(false);
  });
});

describe('timedAsync', () => {
  it('reports elapsed time after the promise resolves', async () => {
    const v = await timedAsync('async-ok', async () => 'value');
    expect(v).toBe('value');
    expect(_getLastPerfReportForTesting()?.label).toBe('async-ok');
  });

  it('reports failures and re-throws', async () => {
    await expect(
      timedAsync('async-bad', async () => {
        throw new Error('async fail');
      }),
    ).rejects.toThrow('async fail');
    expect(_getLastPerfReportForTesting()?.label).toBe('async-bad (failed)');
  });
});

describe('withPerfLogging', () => {
  it('preserves the wrapped function signature and times each call', () => {
    const add = withPerfLogging('add', (a: number, b: number) => a + b);
    expect(add(2, 3)).toBe(5);
    expect(_getLastPerfReportForTesting()?.label).toBe('add');
  });

  it('handles wrapped async functions', async () => {
    const fetchish = withPerfLogging('fetchish', async (n: number) => n * 2);
    await expect(fetchish(7)).resolves.toBe(14);
    // Flush microtasks so the promise-resolution emit fires before assertion.
    await Promise.resolve();
    expect(_getLastPerfReportForTesting()?.label).toBe('fetchish');
  });
});
