/**
 * Pure event-name + property contract for analytics. Lives in its own
 * file so vitest can import without dragging the React Native PostHog
 * SDK into the bundle.
 */

export type AnalyticsEventMap = {
  // App lifecycle
  app_opened: Record<string, never>;
  onboarding_started: Record<string, never>;
  onboarding_completed: { homeCourseSelected: boolean };
  onboarding_skipped_home_course: Record<string, never>;

  // Round lifecycle
  round_started: { numHolesPlanned: number };
  round_saved: {
    numHolesPlayed: number;
    grossScore: number;
    scoreDifferential: number | null;
  };
  round_deleted: Record<string, never>;
  round_edited: { numHolesPlayed: number; grossScore: number };

  // Engagement
  recommendation_viewed: { kind: 'opportunity' | 'strength' | 'milestone' };
  recommendation_dismissed: { kind: 'opportunity' | 'strength' | 'milestone' };
  drill_practiced: { recommendationKey: string };
  round_shared: { shareType: 'image' | 'pdf' | 'csv' };
  data_exported: { exportType: 'csv' | 'json' };
  data_imported: { roundsCount: number };

  // Premium funnel
  paywall_shown: { source: 'recommendations_teaser' | 'settings' | 'other' };
  paywall_purchase_tapped: { tier: 'monthly' | 'yearly' };
  premium_unlocked: { source: 'mock' | 'storekit' };

  // Errors
  error_caught: { errorType: string; screenName: string };
};

export type AnalyticsEvent = keyof AnalyticsEventMap;
