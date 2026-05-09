/** Pure types and constants for the subscription service.
 * Lives outside subscription.ts so vitest can import without dragging in
 * React / React Native modules.
 */

/** Feature keys that require a Premium subscription. */
export const PREMIUM_FEATURES = [
  'recommendations_engine',
  'trend_chart_full',
  'round_export',
  'unlimited_courses',
] as const;
export type PremiumFeature = (typeof PREMIUM_FEATURES)[number];
