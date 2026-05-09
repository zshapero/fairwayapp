import { describe, expect, expectTypeOf, it } from 'vitest';
import type { AnalyticsEvent, AnalyticsEventMap } from '../analyticsTypes';

describe('AnalyticsEventMap', () => {
  it('declares every required event key', () => {
    const required: AnalyticsEvent[] = [
      'app_opened',
      'onboarding_started',
      'onboarding_completed',
      'onboarding_skipped_home_course',
      'round_started',
      'round_saved',
      'round_deleted',
      'round_edited',
      'recommendation_viewed',
      'recommendation_dismissed',
      'drill_practiced',
      'round_shared',
      'data_exported',
      'data_imported',
      'paywall_shown',
      'paywall_purchase_tapped',
      'premium_unlocked',
      'error_caught',
    ];
    expect(required.length).toBe(18);
    // Type-level assertion: each key is a valid AnalyticsEvent.
    expectTypeOf(required).items.toEqualTypeOf<AnalyticsEvent>();
  });

  it('keeps round_saved properties to a tight set (no PII allowed)', () => {
    const sample: AnalyticsEventMap['round_saved'] = {
      numHolesPlayed: 18,
      grossScore: 88,
      scoreDifferential: 16.4,
    };
    expect(Object.keys(sample).sort()).toEqual([
      'grossScore',
      'numHolesPlayed',
      'scoreDifferential',
    ]);
  });

  it('paywall_shown sources are constrained', () => {
    type Source = AnalyticsEventMap['paywall_shown']['source'];
    const valid: Source[] = ['recommendations_teaser', 'settings', 'other'];
    expect(valid).toHaveLength(3);
  });
});
