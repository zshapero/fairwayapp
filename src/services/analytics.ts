import Constants from 'expo-constants';
import PostHog from 'posthog-react-native';
import type { AnalyticsEvent, AnalyticsEventMap } from './analyticsTypes';

export type { AnalyticsEvent, AnalyticsEventMap } from './analyticsTypes';

const isDev = (): boolean =>
  typeof __DEV__ !== 'undefined' ? __DEV__ : false;

let client: PostHog | null = null;
let initStarted = false;

interface ExtraConfig {
  posthogApiKey?: string;
  posthogHost?: string;
}

function readConfig(): { apiKey: string | undefined; host: string | undefined } {
  const extra = (Constants.expoConfig?.extra as ExtraConfig | undefined) ?? {};
  return {
    apiKey: process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? extra.posthogApiKey,
    host:
      process.env.EXPO_PUBLIC_POSTHOG_HOST ??
      extra.posthogHost ??
      'https://us.i.posthog.com',
  };
}

/**
 * Initialize PostHog once on app start.  No-ops in __DEV__ and when no
 * API key is configured so the app boots cleanly in either case.
 */
export async function initPosthog(): Promise<void> {
  if (initStarted) return;
  initStarted = true;
  if (isDev()) return;
  const { apiKey, host } = readConfig();
  if (apiKey === undefined || apiKey.trim() === '') return;
  try {
    client = new PostHog(apiKey, {
      host,
      flushAt: 20,
      flushInterval: 30_000,
      // Default capture behavior: anonymous distinct ids until identifyUser fires.
      enableSessionReplay: false,
    });
    await client.ready;
  } catch {
    client = null;
  }
}

/**
 * Capture a typed event. Properties are validated by the
 * {@link AnalyticsEventMap} type at compile time.
 *
 * Privacy: callers must never pass PII (names, emails, course names, etc.)
 * — the event-property types only allow numbers and short string unions.
 */
export function trackEvent<E extends AnalyticsEvent>(
  event: E,
  properties: AnalyticsEventMap[E],
): void {
  if (isDev()) return;
  if (client === null) return;
  try {
    // AnalyticsEventMap entries are limited to numbers, booleans, and short
    // string-literal unions, all of which satisfy PostHog's JsonType at
    // runtime even if the type can't be narrowed statically.
    client.capture(event, properties as Parameters<PostHog['capture']>[1]);
  } catch {
    // Analytics must never break the app.
  }
}

/** Associate subsequent events with the given player. Avoid passing PII. */
export function identifyUser(playerId: number): void {
  if (isDev()) return;
  if (client === null) return;
  try {
    client.identify(`player-${playerId}`);
  } catch {
    // Ignore.
  }
}

/** Test-only: reset internal state. Not part of the public surface. */
export function _resetAnalyticsForTesting(): void {
  client = null;
  initStarted = false;
}
