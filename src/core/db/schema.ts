/** Schema version tracked in the schema_version table. Bump when migrations are added. */
export const SCHEMA_VERSION = 3;

/** All DDL needed to bring an empty database up to {@link SCHEMA_VERSION}. */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  gender TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  external_id TEXT,
  club_name TEXT NOT NULL,
  course_name TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  num_holes INTEGER NOT NULL,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  tee_name TEXT NOT NULL,
  gender TEXT,
  course_rating REAL NOT NULL,
  slope_rating INTEGER NOT NULL,
  total_yards INTEGER,
  par_total INTEGER,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tee_holes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tee_id INTEGER NOT NULL,
  hole_number INTEGER NOT NULL,
  par INTEGER NOT NULL,
  yardage INTEGER,
  stroke_index INTEGER NOT NULL,
  FOREIGN KEY (tee_id) REFERENCES tees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rounds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  tee_id INTEGER NOT NULL,
  played_at TEXT NOT NULL,
  num_holes_played INTEGER NOT NULL,
  pcc REAL NOT NULL DEFAULT 0,
  course_handicap INTEGER NOT NULL,
  adjusted_gross_score INTEGER,
  score_differential REAL,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (player_id) REFERENCES players(id),
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (tee_id) REFERENCES tees(id)
);

CREATE TABLE IF NOT EXISTS hole_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  round_id INTEGER NOT NULL,
  hole_number INTEGER NOT NULL,
  par INTEGER NOT NULL,
  strokes INTEGER NOT NULL,
  putts INTEGER,
  fairway_hit INTEGER,
  green_in_regulation INTEGER,
  penalty_strokes INTEGER,
  sand_save INTEGER,
  FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS handicap_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  calculated_at TEXT NOT NULL,
  handicap_index REAL NOT NULL,
  rounds_used_count INTEGER NOT NULL,
  triggering_round_id INTEGER,
  FOREIGN KEY (player_id) REFERENCES players(id),
  FOREIGN KEY (triggering_round_id) REFERENCES rounds(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tees_course ON tees(course_id);
CREATE INDEX IF NOT EXISTS idx_tee_holes_tee ON tee_holes(tee_id);
CREATE INDEX IF NOT EXISTS idx_rounds_player ON rounds(player_id);
CREATE INDEX IF NOT EXISTS idx_hole_scores_round ON hole_scores(round_id);
CREATE INDEX IF NOT EXISTS idx_handicap_snapshots_player ON handicap_snapshots(player_id);

CREATE TABLE IF NOT EXISTS drill_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  recommendation_key TEXT NOT NULL,
  logged_at TEXT NOT NULL,
  notes TEXT,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_drill_log_player ON drill_log(player_id);

CREATE TABLE IF NOT EXISTS recent_searches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  searched_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recent_searches_at ON recent_searches(searched_at DESC);
`;
