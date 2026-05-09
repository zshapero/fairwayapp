import { describe, expect, it } from 'vitest';
import { PREMIUM_FEATURES } from '../subscriptionTypes';

describe('PREMIUM_FEATURES', () => {
  it('includes the feature keys called out in the spec', () => {
    expect(PREMIUM_FEATURES).toEqual([
      'recommendations_engine',
      'trend_chart_full',
      'round_export',
      'unlimited_courses',
    ]);
  });
});
