# Privacy

This is a placeholder for Fairway's full privacy policy. The final policy
will replace this file before public launch.

## What we collect today

- **Your golf data**, locally on your device: rounds, hole-by-hole scores,
  notes, and the courses you've imported. This data lives in a SQLite
  database in the app's sandbox. It is never uploaded.
- **Anonymous product analytics** via PostHog. We use this to understand
  which features are being used so we can improve the app. We do **not**
  include personally-identifying information in these events. Specifically:
  - We never send your name, email, or any identifier you can read.
  - We never send the names of the courses you play.
  - We never send notes you've written about a round.
  - We never send your location.
  - We do send numeric event metadata (e.g., the gross score on a saved
    round, the number of holes played) tied only to a random anonymous id
    PostHog generates.
- **Crash reports** via Sentry. When the app crashes, Sentry collects a
  stack trace and basic device metadata so we can fix bugs. Stack traces
  may incidentally contain values that were live in memory at the time of
  the crash. We do not send your golf data fields to Sentry on purpose.

## What we don't collect

- We don't have a server you could send data to. There is no Fairway
  account.
- We don't sell or share data with advertisers.
- We don't track you across other apps.

## Opting out

If you don't want to send anonymous analytics or crash reports, you can
build Fairway from source without setting `EXPO_PUBLIC_POSTHOG_API_KEY`
or `EXPO_PUBLIC_SENTRY_DSN`. We're working on an in-app toggle for the
shipped builds — until then, an opt-out checkbox in Settings will be
added before public launch.

## Contact

Until launch, feel free to reach out via the in-app *Send feedback* link
in Settings.
