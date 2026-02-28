-- ============================================================
-- 00002_seed_data.sql — Real season data
-- Run AFTER 00001_schema.sql
-- All data sourced from the real CSV / xlsx spreadsheets.
-- ============================================================

-- ── Scoring Rules ─────────────────────────────────────────────
INSERT INTO scoring_rules (code, points, label, emoji, accumulates, is_seasonal) VALUES
  ('E',  1,  'Makes Ru laugh / Acrobatic / Winning bestie', '😂', true,  false),
  ('C',  2,  'Wig snatch / Clothing reveal',                '💇', true,  false),
  ('A',  5,  'Mini challenge — top queen',                  '✨', false, false),
  ('B',  3,  'Safe / Lip sync winner',                      '💋', false, false),
  ('D',  10, 'Maxi challenge winner',                       '🏆', false, false),
  ('F', -2,  'Relying on body / Loses wig / Nip slip',      '😬', false, false),
  ('G', -1,  'Feuding queens',                              '👊', false, false),
  ('H',  50, 'You correctly picked the season winner',      '👑', false, true),
  ('I',  30, 'Season winner is on your team',               '⭐', false, true),
  ('J',  25, 'Miss Congeniality is on your team',           '💝', false, true),
  ('K',  20, 'Your queen makes the finale',                 '🎭', false, true);

-- ── Season ────────────────────────────────────────────────────
INSERT INTO seasons (id, name, short_name, total_episodes, aired_episodes, teams_locked, pot_per_player, pot_split)
VALUES (1, 'RuPaul''s Drag Race', 'RPDR', 16, 8, true,
        20, '{"first":0.60,"second":0.25,"third":0.15}');

-- ── Show Queens ───────────────────────────────────────────────
INSERT INTO show_queens (id, season_id, name, eliminated, eliminated_ep, ui_color, sort_order) VALUES
  (1,  1, 'Athena Dion',          false, null, '#FF6B9D', 1),
  (2,  1, 'Briar Blush',          true,  4,    '#A78BFA', 2),
  (3,  1, 'Ciara Myst',           true,  5,    '#34D399', 3),
  (4,  1, 'Darlene Mitchell',     false, null, '#FB923C', 4),
  (5,  1, 'DD Fuego',             true,  1,    '#F87171', 5),
  (6,  1, 'Discord Addams',       false, null, '#818CF8', 6),
  (7,  1, 'Jane Don''t',          false, null, '#FBBF24', 7),
  (8,  1, 'Juicy Love Dion',      false, null, '#F472B6', 8),
  (9,  1, 'Kenya Pleaser',        false, null, '#2DD4BF', 9),
  (10, 1, 'Mandy Mango',          true,  2,    '#FCD34D', 10),
  (11, 1, 'Mia Starr',            false, null, '#60A5FA', 11),
  (12, 1, 'Myki Meeks',           false, null, '#C084FC', 12),
  (13, 1, 'Nini Coco',            false, null, '#4ADE80', 13),
  (14, 1, 'Vita VonTesse Starr',  true,  5,    '#F9A8D4', 14);

-- Reset sequences so future INSERTs auto-increment correctly
SELECT setval('show_queens_id_seq', 14);
SELECT setval('seasons_id_seq', 1);

-- ── Episode Metadata ──────────────────────────────────────────
INSERT INTO episodes (season_id, number, title, aired, summary) VALUES
  (1, 1,  'Episode 1',  true,  'Nini Coco dominates with a Maxi win (D+B = 13 pts). Kenya Pleaser scores big with E+A+E.'),
  (1, 2,  'Episode 2',  true,  'Jane Don''t sweeps with E+E+D (12 pts). Mia Starr wins Mini with E+A.'),
  (1, 3,  'Episode 3',  true,  'Juicy Love Dion wins the Maxi (D = 10 pts). Darlene Mitchell wins Mini (A = 5 pts).'),
  (1, 4,  'Episode 4',  true,  'Vita VonTesse Starr scores D+E (11 pts). Several G penalties for feuding queens.'),
  (1, 5,  'Episode 5',  true,  'Juicy Love Dion EXPLODES — D + 5×E + B = 18 pts! Mia Starr also scores big with D+C+B.'),
  (1, 6,  'Episode 6',  true,  'Athena Dion rebounds with D+B+E+E (15 pts). Steady episode across the remaining queens.'),
  (1, 7,  'Episode 7',  true,  'Myki Meeks scores D+E (11 pts). Jane Don''t and Darlene Mitchell both earn A+E.'),
  (1, 8,  'Episode 8',  true,  'Nini Coco explodes with D+5×E (15 pts)! Myki Meeks also massive — A+8×E (13 pts).'),
  (1, 9,  'Episode 9',  false, null),
  (1, 10, 'Episode 10', false, null),
  (1, 11, 'Episode 11', false, null),
  (1, 12, 'Episode 12', false, null),
  (1, 13, 'Episode 13', false, null),
  (1, 14, 'Episode 14', false, null),
  (1, 15, 'Episode 15', false, null),
  (1, 16, 'FINALE',     false, null);

-- ── Episode Queen Scores (episodes 1–8) ──────────────────────
-- Codes verified against CSV "Episode Point Tally" sheet.
-- E and C appear once per point earned (3×E = ARRAY['E','E','E']).
-- Empty episodes are omitted (no row needed).

-- Queen 1: Athena Dion
INSERT INTO episode_queen_scores (season_id, episode, queen_id, codes) VALUES
  (1, 1, 1, ARRAY['E','G','B']),
  (1, 2, 1, ARRAY['B']),
  (1, 3, 1, ARRAY['B']),
  (1, 4, 1, ARRAY['E','B','G']),
  (1, 6, 1, ARRAY['D','B','E','E']),
  (1, 7, 1, ARRAY['B','E']),
  (1, 8, 1, ARRAY['B','E','E','E']);

-- Queen 2: Briar Blush (eliminated ep 4)
INSERT INTO episode_queen_scores (season_id, episode, queen_id, codes) VALUES
  (1, 1, 2, ARRAY['G','B']),
  (1, 2, 2, ARRAY['B']),
  (1, 3, 2, ARRAY['B']),
  (1, 4, 2, ARRAY['G']);

-- Queen 3: Ciara Myst (eliminated ep 5)
INSERT INTO episode_queen_scores (season_id, episode, queen_id, codes) VALUES
  (1, 1, 3, ARRAY['E','B']),
  (1, 2, 3, ARRAY['B']),
  (1, 3, 3, ARRAY['B']),
  (1, 4, 3, ARRAY['A','E']),
  (1, 5, 3, ARRAY['C']);

-- Queen 4: Darlene Mitchell
INSERT INTO episode_queen_scores (season_id, episode, queen_id, codes) VALUES
  (1, 1, 4, ARRAY['E','B']),
  (1, 2, 4, ARRAY['B']),
  (1, 3, 4, ARRAY['A']),
  (1, 4, 4, ARRAY['B']),
  (1, 5, 4, ARRAY['B','E','C']),
  (1, 7, 4, ARRAY['A','E']),
  (1, 8, 4, ARRAY['B','E','E']);

-- Queen 5: DD Fuego (eliminated ep 1)
INSERT INTO episode_queen_scores (season_id, episode, queen_id, codes) VALUES
  (1, 1, 5, ARRAY['B']);

-- Queen 6: Discord Addams
INSERT INTO episode_queen_scores (season_id, episode, queen_id, codes) VALUES
  (1, 1, 6, ARRAY['B']),
  (1, 2, 6, ARRAY['B']),
  (1, 3, 6, ARRAY['B']),
  (1, 4, 6, ARRAY['B']),
  (1, 6, 6, ARRAY['B','E']),
  (1, 7, 6, ARRAY['B']),
  (1, 8, 6, ARRAY['B','E','E','E','E','E']);

-- Queen 7: Jane Don't
INSERT INTO episode_queen_scores (season_id, episode, queen_id, codes) VALUES
  (1, 1, 7, ARRAY['E','B']),
  (1, 2, 7, ARRAY['E','E','D']),
  (1, 3, 7, ARRAY['A']),
  (1, 4, 7, ARRAY['A','E']),
  (1, 6, 7, ARRAY['A','E']),
  (1, 7, 7, ARRAY['A','E']),
  (1, 8, 7, ARRAY['A','E','E','E','E']);

-- Queen 8: Juicy Love Dion
INSERT INTO episode_queen_scores (season_id, episode, queen_id, codes) VALUES
  (1, 1, 8, ARRAY['E','B']),
  (1, 2, 8, ARRAY['E','E','B']),
  (1, 3, 8, ARRAY['D']),
  (1, 4, 8, ARRAY['E','B']),
  (1, 5, 8, ARRAY['D','E','E','E','E','E','B']),
  (1, 7, 8, ARRAY['B','E','E','E','E']),
  (1, 8, 8, ARRAY['B','E']);

-- Queen 9: Kenya Pleaser
INSERT INTO episode_queen_scores (season_id, episode, queen_id, codes) VALUES
  (1, 1, 9, ARRAY['E','A','E']),
  (1, 2, 9, ARRAY['E','B']),
  (1, 3, 9, ARRAY['B','E']),
  (1, 4, 9, ARRAY['B','E']),
  (1, 6, 9, ARRAY['B','E']),
  (1, 7, 9, ARRAY['B','E']),
  (1, 8, 9, ARRAY['B','E']);

-- Queen 10: Mandy Mango (eliminated ep 2)
INSERT INTO episode_queen_scores (season_id, episode, queen_id, codes) VALUES
  (1, 2, 10, ARRAY['B']);

-- Queen 11: Mia Starr
INSERT INTO episode_queen_scores (season_id, episode, queen_id, codes) VALUES
  (1, 1, 11, ARRAY['E','B']),
  (1, 2, 11, ARRAY['E','A']),
  (1, 3, 11, ARRAY['B']),
  (1, 4, 11, ARRAY['B','G']),
  (1, 5, 11, ARRAY['D','C','B']),
  (1, 7, 11, ARRAY['B']),
  (1, 8, 11, ARRAY['E']);

-- Queen 12: Myki Meeks
INSERT INTO episode_queen_scores (season_id, episode, queen_id, codes) VALUES
  (1, 1, 12, ARRAY['E','B']),
  (1, 2, 12, ARRAY['B']),
  (1, 3, 12, ARRAY['B']),
  (1, 4, 12, ARRAY['B']),
  (1, 6, 12, ARRAY['B','E','E']),
  (1, 7, 12, ARRAY['D','E']),
  (1, 8, 12, ARRAY['A','E','E','E','E','E','E','E','E']);

-- Queen 13: Nini Coco
INSERT INTO episode_queen_scores (season_id, episode, queen_id, codes) VALUES
  (1, 1, 13, ARRAY['D','B']),
  (1, 2, 13, ARRAY['B']),
  (1, 3, 13, ARRAY['B']),
  (1, 4, 13, ARRAY['E','B']),
  (1, 5, 13, ARRAY['B','E','E']),
  (1, 7, 13, ARRAY['B','E']),
  (1, 8, 13, ARRAY['D','E','E','E','E','E']);

-- Queen 14: Vita VonTesse Starr (eliminated ep 5)
INSERT INTO episode_queen_scores (season_id, episode, queen_id, codes) VALUES
  (1, 1, 14, ARRAY['A','E']),
  (1, 2, 14, ARRAY['B']),
  (1, 3, 14, ARRAY['B']),
  (1, 4, 14, ARRAY['D','E']),
  (1, 5, 14, ARRAY['B']);

-- ── League Players ────────────────────────────────────────────
-- auth_id is NULL until each player creates a Supabase account
-- and claims their profile (see SETUP.md for the claim flow).
-- Jill (id matches position in array) is the admin.
INSERT INTO players (id, display_name, is_admin) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Mary Grace', false),
  ('00000000-0000-0000-0000-000000000002', 'Jordan',     false),
  ('00000000-0000-0000-0000-000000000003', 'Evan',       false),
  ('00000000-0000-0000-0000-000000000004', 'Jill',       true),   -- admin
  ('00000000-0000-0000-0000-000000000005', 'Matthew',    false),
  ('00000000-0000-0000-0000-000000000006', 'Meredith',   false),
  ('00000000-0000-0000-0000-000000000007', 'Mikayla',    false),
  ('00000000-0000-0000-0000-000000000008', 'Mere',       false),
  ('00000000-0000-0000-0000-000000000009', 'Emilee',     false),
  ('00000000-0000-0000-0000-000000000010', 'Marci',      false),
  ('00000000-0000-0000-0000-000000000011', 'Gaetan',     false),
  ('00000000-0000-0000-0000-000000000012', 'Andi',       false),
  ('00000000-0000-0000-0000-000000000013', 'Emma',       false),
  ('00000000-0000-0000-0000-000000000014', 'Frankie',    false),
  ('00000000-0000-0000-0000-000000000015', 'Cabell',     false),
  ('00000000-0000-0000-0000-000000000016', 'Ellie',      false),
  ('00000000-0000-0000-0000-000000000017', 'Britt',      false),
  ('00000000-0000-0000-0000-000000000018', 'Nadine',     false),
  ('00000000-0000-0000-0000-000000000019', 'Haley',      false),
  ('00000000-0000-0000-0000-000000000020', 'Jeri',       false);

-- ── Team Submissions ──────────────────────────────────────────
-- queen_ids: exactly 5 queen IDs from the X marks in the xlsx.
-- winner_pick: the queen ID from the Y mark (their season winner prediction).
-- Verified against episode math — all totals match.
INSERT INTO team_submissions (player_id, season_id, queen_ids, winner_pick) VALUES
  ('00000000-0000-0000-0000-000000000001', 1, ARRAY[7,8,9,12,13],   null),  -- Mary Grace
  ('00000000-0000-0000-0000-000000000002', 1, ARRAY[4,8,12,13,14],  7),     -- Jordan
  ('00000000-0000-0000-0000-000000000003', 1, ARRAY[4,8,12,13,14],  7),     -- Evan (same team as Jordan)
  ('00000000-0000-0000-0000-000000000004', 1, ARRAY[1,6,7,8,11],    null),  -- Jill
  ('00000000-0000-0000-0000-000000000005', 1, ARRAY[1,4,7,9,13],    null),  -- Matthew
  ('00000000-0000-0000-0000-000000000006', 1, ARRAY[3,7,8,9,12],    null),  -- Meredith
  ('00000000-0000-0000-0000-000000000007', 1, ARRAY[4,5,8,12,13],   7),     -- Mikayla
  ('00000000-0000-0000-0000-000000000008', 1, ARRAY[1,7,9,11,14],   8),     -- Mere
  ('00000000-0000-0000-0000-000000000009', 1, ARRAY[1,3,11,12,13],  null),  -- Emilee
  ('00000000-0000-0000-0000-000000000010', 1, ARRAY[7,8,9,10,12],   11),    -- Marci
  ('00000000-0000-0000-0000-000000000011', 1, ARRAY[1,5,8,9,13],    null),  -- Gaetan
  ('00000000-0000-0000-0000-000000000012', 1, ARRAY[1,10,12,13,14], 7),     -- Andi
  ('00000000-0000-0000-0000-000000000013', 1, ARRAY[3,4,9,13,14],   7),     -- Emma
  ('00000000-0000-0000-0000-000000000014', 1, ARRAY[3,8,9,10,13],   4),     -- Frankie
  ('00000000-0000-0000-0000-000000000015', 1, ARRAY[5,8,10,11,13],  7),     -- Cabell
  ('00000000-0000-0000-0000-000000000016', 1, ARRAY[1,5,7,11,14],   null),  -- Ellie
  ('00000000-0000-0000-0000-000000000017', 1, ARRAY[2,3,7,9,12],    null),  -- Britt
  ('00000000-0000-0000-0000-000000000018', 1, ARRAY[2,6,7,9,14],    null),  -- Nadine
  ('00000000-0000-0000-0000-000000000019', 1, ARRAY[1,3,9,10,12],   null),  -- Haley
  ('00000000-0000-0000-0000-000000000020', 1, ARRAY[3,5,9,10,13],   null);  -- Jeri

-- ── Compute player scores for all aired episodes ───────────────
-- This populates player_episode_scores from the episode_queen_scores above.
SELECT compute_episode_scores(1, 1);
SELECT compute_episode_scores(1, 2);
SELECT compute_episode_scores(1, 3);
SELECT compute_episode_scores(1, 4);
SELECT compute_episode_scores(1, 5);
SELECT compute_episode_scores(1, 6);
SELECT compute_episode_scores(1, 7);
SELECT compute_episode_scores(1, 8);

-- ── Sanity check: verify leaderboard totals ───────────────────
-- Expected top 3: Mary Grace ~220, Jordan/Evan ~208, Jill ~198
SELECT
  p.display_name,
  COALESCE(SUM(pes.points), 0) AS total_pts
FROM players p
LEFT JOIN player_episode_scores pes
  ON pes.player_id = p.id AND pes.season_id = 1
GROUP BY p.display_name
ORDER BY total_pts DESC;
