/**
 * NOTE: This file mirrors `/assets/legal/privacy.md`. The .md file is the
 * canonical source for human review (and what gets shipped on a future
 * web privacy page). This TS export is what the app actually bundles for
 * the Settings → Legal screen.
 *
 * Keep both in sync. If you change one, change the other. There is a
 * verification test in `src/legal/__tests__/legalContent.test.ts`.
 */

export const PRIVACY_MD = `# Privacy Policy

_Last updated: [DATE TO BE SET AT LAUNCH]_

Fairway is a personal handicap-tracking app for golfers. We built it the way we wanted to use it: your data lives on your device, and the only information that leaves your phone is what's needed to fetch course data, weather, and to keep the app working. There's no Fairway account, no shared social feed, and nothing for sale to advertisers.

This policy explains what we collect, how we use it, and what choices you have. If anything here is unclear, please reach out using the contact details at the bottom.

## Information we collect

### Stored on your device only

- **Your golf data.** Every round you record, hole-by-hole scores, putts, fairways hit, greens in regulation, penalties, sand saves, notes you write, the courses you import, and the tees you've played. This is stored in a local SQLite database in the app's sandbox on your phone. It is not uploaded anywhere.
- **Your handicap history.** A rolling history of your World Handicap System index calculations.
- **Your preferences.** Units (imperial / metric), time format, default tee, your selected home course, and your subscription tier.
- **Your home-course choice.** Stored as a reference to a course in your local database.

### Sent off your device

- **Anonymous product analytics.** We send small, anonymized event records to PostHog so we can understand which features get used. These events include things like "a round was saved" or "the paywall was shown" along with non-identifying numeric metadata (like the gross score on a round). They never include your name, email, course names, location, or anything you've typed. PostHog assigns a random anonymous id; if you complete onboarding, that id is paired with a non-PII reference like \`player-1\` so we can deduplicate your sessions across launches.
- **Crash reports.** When the app crashes, Sentry collects a stack trace and basic device metadata (OS version, device model, locale) so we can fix bugs. Stack traces may incidentally contain values that were live in memory at the time of the crash. We do not deliberately send your golf data to Sentry.
- **Course searches.** When you search for a course or import one, we send your search query (and, after import, the course's identifier) to golfcourseapi.com so they can return matching courses. Your name and any identifier we hold for you are never sent.
- **Weather lookups.** When you save a round, we send the latitude / longitude of the course and the date played to open-meteo.com to fetch the weather for that round. No identifier of yours is sent.
- **Subscription transactions.** If you subscribe to Premium, the transaction is handled by Apple via StoreKit (and, in a future update, RevenueCat acting on Apple's behalf). Apple receives the information needed to bill you. We receive only confirmation of an active subscription.

## How we use it

- **To make the app work.** Local data renders the screens, calculates your handicap, and surfaces your trends and recommendations.
- **To improve the app.** Anonymous analytics tell us which features get used, where users drop off, and which patterns are common. We act on these patterns; we do not look at individuals.
- **To fix bugs.** Crash reports help us understand failures we wouldn't see otherwise.
- **To fulfill your purchase.** If you subscribe, we use Apple's confirmation to unlock Premium features.

We do not use any of this data for advertising, profiling, or to build a marketing list. We do not sell or rent it to anyone.

## Third-party services

| Service | Purpose | What is sent |
|---|---|---|
| **Sentry** ([sentry.io](https://sentry.io)) | Crash reporting | Stack traces, device metadata, app version |
| **PostHog** ([posthog.com](https://posthog.com)) | Anonymous product analytics | Event names + small numeric / categorical properties |
| **golfcourseapi.com** | Course catalog | Your search queries; course identifiers |
| **open-meteo.com** | Weather lookups | Course latitude / longitude and a date |
| **Apple StoreKit** (future: via **RevenueCat**) | Subscription billing | Whatever Apple needs to process the transaction |

Each of these services has its own privacy policy. We have no control over what they do with the data once they receive it, beyond what we ask them not to do (which is summarized in the table above).

## Children's privacy

Fairway is not directed at children under 13, and we do not knowingly collect any information from children under 13. If you believe a child under 13 has used Fairway and shared information with us, please contact us and we'll delete it.

## Your rights

Because virtually all of your data lives on your device, you have direct control:

- **Access.** Open the app — your data is right there.
- **Correction.** Use the Edit Round flow to change any round; use Settings → Profile to update your name and other preferences.
- **Deletion.** Use Settings → Data → Clear all data to wipe every round, course, snapshot, and preference. This action is immediate and irreversible.
- **Portability.** We're working on a Premium "Export rounds" feature that will let you download your data as CSV or JSON.

For the small amount of data that goes to third parties, you can also:

- **Opt out of analytics and crash reporting.** A toggle in Settings is on the roadmap for the public launch. In the meantime, building Fairway from source without \`EXPO_PUBLIC_POSTHOG_API_KEY\` and \`EXPO_PUBLIC_SENTRY_DSN\` set will disable both.
- **Manage your subscription.** Use the App Store's Subscription settings on your device.

If you live in a jurisdiction that grants additional rights (such as the EU under GDPR or California under CCPA), you may also request access, correction, deletion, or restriction of any personal data we hold. Because we hold so little, most of these requests amount to "delete the analytics distinct id." Contact us using the details below and we'll forward the request to the relevant service.

## Security

Local data sits inside the app's iOS sandbox, which is encrypted at rest by iOS when your device has a passcode set. Network requests use HTTPS. We don't have a server to compromise.

That said, no system is perfectly secure. If you suspect your device or our app has been compromised, please let us know.

## Changes to this policy

We'll update this policy when our practices change. Material changes (new third parties, new data collected) will be announced in the app before they take effect. The "Last updated" date at the top of this page always reflects the most recent revision.

## Contact

Questions, concerns, or requests:

**hello@fairway.app**

You can also reach us via Settings → About → Send feedback inside the app.
`;
