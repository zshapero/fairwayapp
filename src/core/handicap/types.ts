/**
 * A single hole's score within a round.
 */
export interface HoleScore {
  /** Hole number, 1-18. */
  holeNumber: number;
  /** Par for the hole. */
  par: number;
  /** Actual gross strokes taken on the hole. */
  strokes: number;
  /** Stroke index for the hole, 1 (hardest) through 18 (easiest). */
  strokeIndex: number;
}

/**
 * Inputs needed to evaluate a single round under the World Handicap System.
 */
export interface RoundInput {
  /** Per-hole scoring data for the round. */
  holeScores: HoleScore[];
  /** Course Rating for the tee played. */
  courseRating: number;
  /** Slope Rating for the tee played. */
  slopeRating: number;
  /** Playing Conditions Calculation adjustment, typically in [-1, 3]. */
  pcc: number;
  /**
   * Course Handicap that applied to the player for this round, used to
   * allocate strokes-received per hole when computing adjusted gross score.
   */
  courseHandicap: number;
}
