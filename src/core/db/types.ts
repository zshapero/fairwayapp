/**
 * Row shapes mirroring the SQLite schema. SQLite stores booleans as 0/1
 * integers, so boolean-valued columns use the {@link IntBool} type.
 */
export type IntBool = 0 | 1;

export type SubscriptionTier = 'free' | 'premium';
export type PreferredUnits = 'imperial' | 'metric';
export type TimeFormat = '12h' | '24h';

export interface Player {
  id: number;
  name: string;
  email: string | null;
  gender: string | null;
  created_at: string;
  updated_at: string;
  subscription_tier: SubscriptionTier;
  subscription_started_at: number | null;
  subscription_expires_at: number | null;
  preferred_units: PreferredUnits;
  time_format: TimeFormat;
  preferred_tee_id: number | null;
  onboarded: 0 | 1;
  home_course_id: number | null;
}

export interface Course {
  id: number;
  external_id: string | null;
  club_name: string;
  course_name: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  num_holes: number;
  is_favorite: IntBool;
  created_at: string;
}

export interface Tee {
  id: number;
  course_id: number;
  tee_name: string;
  gender: string | null;
  course_rating: number;
  slope_rating: number;
  total_yards: number | null;
  par_total: number | null;
}

export interface TeeHole {
  id: number;
  tee_id: number;
  hole_number: number;
  par: number;
  yardage: number | null;
  stroke_index: number;
}

export interface Round {
  id: number;
  player_id: number;
  course_id: number;
  tee_id: number;
  played_at: string;
  num_holes_played: number;
  pcc: number;
  course_handicap: number;
  adjusted_gross_score: number | null;
  score_differential: number | null;
  notes: string | null;
  created_at: string;
}

export interface HoleScore {
  id: number;
  round_id: number;
  hole_number: number;
  par: number;
  strokes: number;
  putts: number | null;
  fairway_hit: IntBool | null;
  green_in_regulation: IntBool | null;
  penalty_strokes: number | null;
  sand_save: IntBool | null;
}

export interface HandicapSnapshot {
  id: number;
  player_id: number;
  calculated_at: string;
  handicap_index: number;
  rounds_used_count: number;
  triggering_round_id: number | null;
}

/** Names of all data tables managed by the schema (excludes schema_version). */
export const DATA_TABLES = [
  'players',
  'courses',
  'tees',
  'tee_holes',
  'rounds',
  'hole_scores',
  'handicap_snapshots',
  'drill_log',
  'recent_searches',
] as const;

export type DataTable = (typeof DATA_TABLES)[number];
