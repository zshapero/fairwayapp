export type ConfidenceLevel = 'high' | 'moderate' | 'emerging';
export type RecommendationKind = 'opportunity' | 'strength' | 'milestone';

export interface Recommendation {
  /** Stable key used by drill_log to record practice. */
  key: string;
  kind: RecommendationKind;
  title: string;
  /** A one-sentence description of the pattern. */
  body: string;
  /** Concrete suggestion for how to act on the pattern. */
  suggestion?: string;
  /** Required for opportunities; ignored otherwise. */
  confidence?: ConfidenceLevel;
}

/**
 * Static placeholder set used until the deterministic 12-pattern engine
 * lands. Numbers and language are tuned to look real on the demo player.
 */
export const DEMO_RECOMMENDATIONS: Recommendation[] = [
  {
    key: 'three_putt_freq',
    kind: 'opportunity',
    title: 'Three-putt frequency',
    body: 'Three-putts on 11% of greens this month — about double your six-month baseline.',
    suggestion: 'Spend 15 minutes on lag putts from 30+ feet before your next round.',
    confidence: 'high',
  },
  {
    key: 'approach_distance',
    kind: 'opportunity',
    title: 'Approach distance control',
    body: 'On 150-180y approaches you’re short of the green 41% of the time.',
    suggestion: 'Default to one extra club from this distance for the next three rounds.',
    confidence: 'moderate',
  },
  {
    key: 'first_tee_tempo',
    kind: 'opportunity',
    title: 'First-tee tempo',
    body: 'Opening holes have averaged +1.3 to par over the last six rounds.',
    suggestion: 'Add a 60-second pre-round routine at the practice tee.',
    confidence: 'emerging',
  },
  {
    key: 'gir_strength',
    kind: 'strength',
    title: 'Greens in regulation',
    body: '23% above the average for your handicap level. Keep doing what you’re doing.',
  },
  {
    key: 'crossed_16',
    kind: 'milestone',
    title: 'Crossed 16.0 for the first time',
    body: 'Two weeks ago — your lowest index on record.',
  },
];

/**
 * Rule #17 (weather-aware) — surfaced when a player's last 10 rounds show
 * a mild-vs-windy gap of more than 4 strokes (with 4+ rounds in each
 * bucket). Built dynamically rather than baked into DEMO_RECOMMENDATIONS
 * because it depends on actual round + weather data.
 */
export function buildWeatherAwareRecommendation(delta: number): Recommendation {
  return {
    key: 'weather_aware_performance',
    kind: 'opportunity',
    title: 'The wind has been a problem',
    body: `Your scoring runs about ${delta.toFixed(1)} strokes worse on windy days than on calm ones.`,
    suggestion:
      'On windy days, club up one and swing 80%. Trying to power through wind is the most common amateur mistake. Take what the conditions give you.',
    confidence: 'high',
  };
}
