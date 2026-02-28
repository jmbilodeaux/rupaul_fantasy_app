-- ============================================================
-- 00001_schema.sql — Drag Race Fantasy League
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New Query)
-- ============================================================

-- ── Seasons ──────────────────────────────────────────────────
CREATE TABLE seasons (
  id             SERIAL PRIMARY KEY,
  name           TEXT    NOT NULL,
  short_name     TEXT,
  total_episodes INT     NOT NULL DEFAULT 16,
  aired_episodes INT     NOT NULL DEFAULT 0,
  teams_locked   BOOLEAN NOT NULL DEFAULT false,
  pot_per_player INT     NOT NULL DEFAULT 20,
  pot_split      JSONB   NOT NULL DEFAULT '{"first":0.60,"second":0.25,"third":0.15}',
  season_winner  INT,    -- FK to show_queens; set at finale
  miss_congen    INT,    -- FK to show_queens; set at finale
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ── Show Queens (cast of the TV show) ────────────────────────
CREATE TABLE show_queens (
  id            SERIAL PRIMARY KEY,
  season_id     INT     REFERENCES seasons(id) ON DELETE CASCADE,
  name          TEXT    NOT NULL,
  eliminated    BOOLEAN NOT NULL DEFAULT false,
  eliminated_ep INT,
  ui_color      TEXT    DEFAULT '#FF1493',
  sort_order    INT     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Back-fill season FK references to queens (now that the table exists)
ALTER TABLE seasons
  ADD CONSTRAINT fk_season_winner FOREIGN KEY (season_winner) REFERENCES show_queens(id),
  ADD CONSTRAINT fk_miss_congen   FOREIGN KEY (miss_congen)   REFERENCES show_queens(id);

-- ── Scoring Rules (seeded once, never user-edited) ───────────
CREATE TABLE scoring_rules (
  code        CHAR(1) PRIMARY KEY,
  points      INT     NOT NULL,
  label       TEXT    NOT NULL,
  emoji       TEXT,
  accumulates BOOLEAN NOT NULL DEFAULT false, -- E and C can stack per episode
  is_seasonal BOOLEAN NOT NULL DEFAULT false  -- H/I/J/K applied only at finale
);

-- ── Fantasy League Players (the humans playing) ──────────────
CREATE TABLE players (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id      UUID    UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name TEXT    NOT NULL,
  is_admin     BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ── Team Submissions (locked before Episode 1) ───────────────
CREATE TABLE team_submissions (
  id           SERIAL PRIMARY KEY,
  player_id    UUID  REFERENCES players(id)    ON DELETE CASCADE,
  season_id    INT   REFERENCES seasons(id)    ON DELETE CASCADE,
  queen_ids    INT[] NOT NULL CHECK (array_length(queen_ids, 1) = 5),
  winner_pick  INT   REFERENCES show_queens(id), -- for H/I bonus
  submitted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_id, season_id)
);

-- ── Episode Queen Scores (admin enters codes per queen) ───────
-- For accumulating codes (E, C) the code appears multiple times in the array.
-- e.g. 3× E = ARRAY['E','E','E']
CREATE TABLE episode_queen_scores (
  id         SERIAL PRIMARY KEY,
  season_id  INT   REFERENCES seasons(id)    ON DELETE CASCADE,
  episode    INT   NOT NULL CHECK (episode >= 1),
  queen_id   INT   REFERENCES show_queens(id) ON DELETE CASCADE,
  codes      TEXT[] NOT NULL DEFAULT '{}',
  entered_at TIMESTAMPTZ DEFAULT now(),
  entered_by UUID  REFERENCES players(id),
  UNIQUE(season_id, episode, queen_id)
);

-- ── Player Episode Scores (computed, denormalized for fast reads) ──
CREATE TABLE player_episode_scores (
  id        SERIAL PRIMARY KEY,
  player_id UUID REFERENCES players(id)  ON DELETE CASCADE,
  season_id INT  REFERENCES seasons(id)  ON DELETE CASCADE,
  episode   INT  NOT NULL,
  points    INT  NOT NULL DEFAULT 0,
  UNIQUE(player_id, season_id, episode)
);

-- ── Episode Metadata ──────────────────────────────────────────
CREATE TABLE episodes (
  id        SERIAL PRIMARY KEY,
  season_id INT     REFERENCES seasons(id) ON DELETE CASCADE,
  number    INT     NOT NULL,
  title     TEXT    NOT NULL DEFAULT '',
  aired     BOOLEAN NOT NULL DEFAULT false,
  summary   TEXT,
  UNIQUE(season_id, number)
);

-- ════════════════════════════════════════════════════════════
-- Score Computation Function
-- Called after admin posts episode codes.
-- Reads episode_queen_scores + team_submissions → upserts
-- player_episode_scores for every player in the season.
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION compute_episode_scores(p_season_id INT, p_episode INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER  -- runs with owner privileges so RLS doesn't block it
AS $$
DECLARE
  rec         RECORD;
  v_queen_id  INT;
  v_codes     TEXT[];
  v_pts       INT;
  v_code      TEXT;
  v_rule_pts  INT;
BEGIN
  -- Iterate over every player who has submitted a team for this season
  FOR rec IN
    SELECT p.id AS player_id, ts.queen_ids
    FROM   players p
    JOIN   team_submissions ts
      ON   ts.player_id = p.id AND ts.season_id = p_season_id
  LOOP
    v_pts := 0;

    -- Sum each of the player's 5 queens' codes for this episode
    FOREACH v_queen_id IN ARRAY rec.queen_ids LOOP
      SELECT eqs.codes
      INTO   v_codes
      FROM   episode_queen_scores eqs
      WHERE  eqs.season_id = p_season_id
        AND  eqs.episode   = p_episode
        AND  eqs.queen_id  = v_queen_id;

      IF v_codes IS NOT NULL THEN
        FOREACH v_code IN ARRAY v_codes LOOP
          -- Skip seasonal codes (H/I/J/K) — handled separately at finale
          SELECT sr.points
          INTO   v_rule_pts
          FROM   scoring_rules sr
          WHERE  sr.code = v_code AND sr.is_seasonal = false;

          IF v_rule_pts IS NOT NULL THEN
            v_pts := v_pts + v_rule_pts;
          END IF;
        END LOOP;
      END IF;
    END LOOP;

    -- Upsert the computed total for this player + episode
    INSERT INTO player_episode_scores (player_id, season_id, episode, points)
    VALUES (rec.player_id, p_season_id, p_episode, v_pts)
    ON CONFLICT (player_id, season_id, episode)
    DO UPDATE SET points = EXCLUDED.points;
  END LOOP;
END;
$$;

-- ════════════════════════════════════════════════════════════
-- Row Level Security
-- ════════════════════════════════════════════════════════════
ALTER TABLE seasons               ENABLE ROW LEVEL SECURITY;
ALTER TABLE show_queens           ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_rules         ENABLE ROW LEVEL SECURITY;
ALTER TABLE players               ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_submissions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE episode_queen_scores  ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_episode_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes              ENABLE ROW LEVEL SECURITY;

-- Everyone can read all public data (leaderboard, queens, scores)
CREATE POLICY "public_read" ON seasons               FOR SELECT USING (true);
CREATE POLICY "public_read" ON show_queens           FOR SELECT USING (true);
CREATE POLICY "public_read" ON scoring_rules         FOR SELECT USING (true);
CREATE POLICY "public_read" ON episodes              FOR SELECT USING (true);
CREATE POLICY "public_read" ON player_episode_scores FOR SELECT USING (true);
CREATE POLICY "public_read" ON episode_queen_scores  FOR SELECT USING (true);
CREATE POLICY "public_read" ON team_submissions      FOR SELECT USING (true);
CREATE POLICY "public_read" ON players               FOR SELECT USING (true);

-- Only admins can write episode scores
CREATE POLICY "admin_write_scores" ON episode_queen_scores
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM players
      WHERE auth_id = auth.uid() AND is_admin = true
    )
  );

-- Players can only submit/update their own team while teams are unlocked
CREATE POLICY "player_submit_team" ON team_submissions
  FOR INSERT
  WITH CHECK (
    player_id = (SELECT id FROM players WHERE auth_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM seasons WHERE id = season_id AND teams_locked = false
    )
  );

CREATE POLICY "player_update_own_team" ON team_submissions
  FOR UPDATE
  USING (
    player_id = (SELECT id FROM players WHERE auth_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM seasons WHERE id = season_id AND teams_locked = false
    )
  );

-- Only admins can update season config (lock teams, record winner, etc.)
CREATE POLICY "admin_update_season" ON seasons
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM players WHERE auth_id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "admin_update_queens" ON show_queens
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM players WHERE auth_id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "admin_manage_episodes" ON episodes
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM players WHERE auth_id = auth.uid() AND is_admin = true)
  );

-- Players can update their own row (e.g. display_name) but not is_admin
CREATE POLICY "player_update_own" ON players
  FOR UPDATE
  USING (auth_id = auth.uid())
  WITH CHECK (
    auth_id = auth.uid()
    AND is_admin = (SELECT is_admin FROM players WHERE auth_id = auth.uid())
  );
