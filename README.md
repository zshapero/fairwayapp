# Fairway

Cross-platform handicap tracker, iOS-first. Built with Expo, React Native,
TypeScript, and a local SQLite store.

See `CLAUDE.md` for architecture notes and contribution rules.

## Getting started

```bash
npm install --legacy-peer-deps
cp .env.example .env   # then fill in the keys you need
npm run typecheck
npm test
npx expo start --tunnel
```

`react-native-view-shot`, `@sentry/react-native`, and `posthog-react-native`
are native modules and require either an Expo development build or
EAS-built binary. They no-op gracefully on Expo Go.

## Sentry — crash reporting

Sentry is wired into `src/services/errorReporting.ts`. It is **only active
in non-`__DEV__` builds** and only when a DSN is configured.

To enable:

1. Sign up for [Sentry](https://sentry.io) (free tier).
2. Create a new project of type **React Native**.
3. Copy the DSN from the project's *Client Keys* page.
4. Set it locally:
   ```
   EXPO_PUBLIC_SENTRY_DSN=https://...@o123.ingest.sentry.io/456
   ```
5. For TestFlight / EAS builds, add the same value as a GitHub Actions
   secret named `EXPO_PUBLIC_SENTRY_DSN` and include it in `eas.json`'s
   `env` block for the relevant build profile.

The Debug screen has a `Throw test error (Sentry)` button (visible in
`__DEV__` only) that fires `Sentry.captureException` and reports the
event id back inline so you can verify the DSN.

`tracesSampleRate` is `0.2` (20% of transactions). Adjust in
`src/services/errorReporting.ts` if you want different sampling.

## PostHog — anonymous analytics

PostHog is wired into `src/services/analytics.ts`. Like Sentry, it is
**only active in non-`__DEV__` builds** and only when an API key is
configured. Events are tracked via a typed helper:

```ts
import { trackEvent } from '@/services/analytics';
trackEvent('round_saved', {
  numHolesPlayed: 18,
  grossScore: 88,
  scoreDifferential: 16.4,
});
```

The full event taxonomy lives in `src/services/analyticsTypes.ts`.

To enable:

1. Sign up for [PostHog](https://posthog.com) (1M events/month free tier).
2. Create a new project.
3. Copy the **Project API key** from *Project settings → Project*.
4. Note the instance URL (US default is `https://us.i.posthog.com`).
5. Set locally:
   ```
   EXPO_PUBLIC_POSTHOG_API_KEY=phc_...
   EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
   ```
6. Add the same as GitHub Actions secrets and into `eas.json` for builds.

### Privacy

PostHog is configured for **anonymous** tracking by default. We never
include the player's name, email, course names, or anything else that
could be used to identify a user. See
[`assets/legal/privacy.md`](assets/legal/privacy.md) for the user-facing
note.

The event-property TypeScript types in `analyticsTypes.ts` are
deliberately narrow — adding a free-form `string` field to any event
should be reviewed for PII risk before merging.

## Scripts

| Command | What it does |
|---|---|
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | `vitest run` over the pure-logic test suites |
| `npm run lint` | `eslint` flat config |
| `npm run ios` | `expo start --ios` |
| `npm start` | `expo start` (use `--tunnel` for QR-code-from-anywhere) |
