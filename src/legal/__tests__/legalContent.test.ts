import { describe, expect, it } from 'vitest';
import { PRIVACY_MD } from '../privacy';
import { TERMS_MD } from '../terms';

describe('PRIVACY_MD', () => {
  it('starts with a heading and a "Last updated" placeholder', () => {
    expect(PRIVACY_MD.startsWith('# Privacy Policy')).toBe(true);
    expect(PRIVACY_MD).toContain('_Last updated:');
  });

  it('covers each section called out in the spec', () => {
    const sections = [
      '## Information we collect',
      '## How we use it',
      '## Third-party services',
      "## Children's privacy",
      '## Your rights',
      '## Contact',
    ];
    for (const s of sections) {
      expect(PRIVACY_MD).toContain(s);
    }
  });

  it('mentions the third parties we actually use', () => {
    for (const name of ['Sentry', 'PostHog', 'golfcourseapi.com', 'open-meteo.com', 'StoreKit']) {
      expect(PRIVACY_MD).toContain(name);
    }
  });

  it('explicitly disclaims selling data', () => {
    expect(PRIVACY_MD).toMatch(/do not sell/i);
  });
});

describe('TERMS_MD', () => {
  it('starts with a heading and a "Last updated" placeholder', () => {
    expect(TERMS_MD.startsWith('# Terms of Service')).toBe(true);
    expect(TERMS_MD).toContain('_Last updated:');
  });

  it('covers each section called out in the spec', () => {
    const sections = [
      '## 1. License',
      '## 2. Subscriptions',
      '## 3. Acceptable use',
      '## 5. Handicap calculations',
      '## 6. Disclaimers',
      '## 7. Limitation of liability',
      '## 8. Termination',
      '## 9. Changes',
      '## 10. Governing law',
      '## 11. Contact',
    ];
    for (const s of sections) {
      expect(TERMS_MD).toContain(s);
    }
  });

  it('makes the WHS-not-official disclaimer', () => {
    expect(TERMS_MD).toMatch(/not\W+an? authorized handicap service/i);
    expect(TERMS_MD).toMatch(/not\W+valid for tournament play/i);
  });

  it('leaves a [JURISDICTION] placeholder for the launch step', () => {
    expect(TERMS_MD).toContain('[JURISDICTION TO BE SET AT LAUNCH]');
  });
});
