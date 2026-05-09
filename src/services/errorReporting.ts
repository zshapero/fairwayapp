import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

let initialized = false;

const isDev = (): boolean =>
  typeof __DEV__ !== 'undefined' ? __DEV__ : false;

/**
 * Initialize Sentry once on app start.  No-ops in __DEV__ to keep local
 * development free of background reporting noise; no-ops if no DSN is
 * configured so the app boots cleanly without one.
 */
export function initSentry(): void {
  if (initialized) return;
  if (isDev()) {
    initialized = true;
    return;
  }
  const dsn =
    process.env.EXPO_PUBLIC_SENTRY_DSN ??
    (Constants.expoConfig?.extra as { sentryDsn?: string } | undefined)?.sentryDsn;
  if (dsn === undefined || dsn.trim() === '') {
    initialized = true;
    return;
  }
  Sentry.init({
    dsn,
    environment: 'production',
    tracesSampleRate: 0.2,
    enableAutoPerformanceTracing: true,
    enableNativeCrashHandling: true,
  });
  initialized = true;
}

export interface ErrorContext {
  /** Where in the app the error happened (e.g., "rounds.delete"). */
  scope?: string;
  /** Free-form structured tags to attach to the event. */
  tags?: Record<string, string>;
  /** Free-form structured extra data to attach to the event. */
  extra?: Record<string, unknown>;
}

/**
 * Capture an error with optional structured context.  In __DEV__, logs to
 * the console instead of forwarding to Sentry so local stack traces stay
 * visible.
 */
export function logError(error: unknown, context: ErrorContext = {}): void {
  if (isDev()) {
    console.error('[fairway:error]', context.scope ?? '(no scope)', error, context);
    return;
  }
  if (!initialized) initSentry();
  try {
    Sentry.withScope((scope) => {
      if (context.scope !== undefined) scope.setTag('app.scope', context.scope);
      if (context.tags !== undefined) {
        for (const [k, v] of Object.entries(context.tags)) {
          scope.setTag(k, v);
        }
      }
      if (context.extra !== undefined) {
        for (const [k, v] of Object.entries(context.extra)) {
          scope.setExtra(k, v);
        }
      }
      const ex = error instanceof Error ? error : new Error(String(error));
      Sentry.captureException(ex);
    });
  } catch {
    // Last-resort: never let logError throw.
  }
}

/** Attach the in-DB player id (a small integer) to subsequent events. */
export function setSentryUser(playerId: number | null): void {
  if (isDev()) return;
  if (!initialized) initSentry();
  Sentry.setUser(playerId === null ? null : { id: String(playerId) });
}

/**
 * Dev-only smoke test for the debug screen. Forces a Sentry capture even
 * though normal logError is gated on !__DEV__, so the engineer running the
 * dev build can verify the DSN path works end-to-end. Returns the event id
 * if Sentry was initialized; otherwise null.
 */
export function _devTriggerSentryError(): string | null {
  const error = new Error('Fairway Sentry test error');
  try {
    if (!initialized) {
      const dsn =
        process.env.EXPO_PUBLIC_SENTRY_DSN ??
        (Constants.expoConfig?.extra as { sentryDsn?: string } | undefined)?.sentryDsn;
      if (dsn !== undefined && dsn.trim() !== '') {
        Sentry.init({
          dsn,
          environment: 'development',
          tracesSampleRate: 0,
        });
        initialized = true;
      }
    }
    return Sentry.captureException(error) ?? null;
  } catch {
    return null;
  }
}
