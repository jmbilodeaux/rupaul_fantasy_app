# System Architecture

## Overview

```
┌─────────────────────────────────────────────────────────┐
│                      iOS App (SwiftUI)                   │
│                                                         │
│  Leaderboard  │  My Team  │  Episodes  │  Admin Panel   │
└────────────────────────────┬────────────────────────────┘
                             │ HTTPS / WebSocket
                             ▼
┌─────────────────────────────────────────────────────────┐
│                    Supabase (Free Tier)                  │
│                                                         │
│  PostgreSQL DB  │  Auth  │  Realtime  │  Edge Functions │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

### Weekly Score Entry (Admin)
```
Admin opens app
  → selects "Enter Episode N Scores"
  → for each active show queen: checks which codes apply (A-K)
  → app previews calculated delta for each fantasy player
  → admin taps "Post Scores"
  → iOS app calls Supabase RPC / Edge Function:
      1. Writes episode_queen_scores rows
      2. Computes player_episode_scores for all players
      3. Triggers push notification via APNs
  → Supabase Realtime broadcasts change
  → All connected iOS clients receive update instantly
```

### Player Score Calculation
```sql
-- Pseudocode for score calculation
FOR each fantasy_player IN season:
  episode_score = 0
  FOR each queen_id IN player.team:
    codes = episode_queen_scores WHERE queen_id = queen_id AND episode = N
    FOR each code IN codes:
      episode_score += scoring_rules[code].points

  INSERT INTO player_episode_scores (player_id, season_id, episode, points)
  VALUES (player.id, season.id, N, episode_score)
  ON CONFLICT DO UPDATE SET points = episode_score
```

## Database Schema

```sql
-- Seasons
CREATE TABLE seasons (
  id             SERIAL PRIMARY KEY,
  name           TEXT    NOT NULL,
  total_episodes INT     NOT NULL DEFAULT 16,
  aired_episodes INT     NOT NULL DEFAULT 0,
  teams_locked   BOOLEAN NOT NULL DEFAULT false,
  pot_per_player INT     NOT NULL DEFAULT 10,
  pot_split      JSONB   NOT NULL DEFAULT '{"first":0.60,"second":0.25,"third":0.15}',
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Show queens (cast of the actual TV show)
CREATE TABLE show_queens (
  id             SERIAL PRIMARY KEY,
  season_id      INT  REFERENCES seasons(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  nickname       TEXT,
  eliminated     BOOLEAN NOT NULL DEFAULT false,
  eliminated_ep  INT,
  ui_color       TEXT DEFAULT '#FF1493',
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Fantasy league players (your friend group)
CREATE TABLE players (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  avatar_emoji TEXT NOT NULL DEFAULT '👑',
  is_admin     BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Team submissions (locked before ep 1)
CREATE TABLE team_submissions (
  id            SERIAL PRIMARY KEY,
  player_id     UUID  REFERENCES players(id)      ON DELETE CASCADE,
  season_id     INT   REFERENCES seasons(id)       ON DELETE CASCADE,
  queen_ids     INT[] NOT NULL,                    -- exactly 5 queen IDs
  winner_pick   INT   REFERENCES show_queens(id),  -- H/I bonus target
  submitted_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_id, season_id)
);

-- Admin enters codes per show queen per episode
CREATE TABLE episode_queen_scores (
  id         SERIAL PRIMARY KEY,
  season_id  INT   REFERENCES seasons(id)    ON DELETE CASCADE,
  episode    INT   NOT NULL,
  queen_id   INT   REFERENCES show_queens(id) ON DELETE CASCADE,
  codes      TEXT[] NOT NULL DEFAULT '{}',   -- e.g. ARRAY['D','E','B']
  entered_at TIMESTAMPTZ DEFAULT now(),
  entered_by UUID  REFERENCES players(id),
  UNIQUE(season_id, episode, queen_id)
);

-- Computed player scores per episode (denormalized for fast reads)
CREATE TABLE player_episode_scores (
  id          SERIAL PRIMARY KEY,
  player_id   UUID REFERENCES players(id)    ON DELETE CASCADE,
  season_id   INT  REFERENCES seasons(id)    ON DELETE CASCADE,
  episode     INT  NOT NULL,
  points      INT  NOT NULL DEFAULT 0,
  codes_summary TEXT,                        -- human-readable "D,B,E,E"
  UNIQUE(player_id, season_id, episode)
);

-- Scoring rules reference (seeded, not user-edited)
CREATE TABLE scoring_rules (
  code        CHAR(1) PRIMARY KEY,
  points      INT  NOT NULL,
  description TEXT NOT NULL,
  is_seasonal BOOLEAN NOT NULL DEFAULT false  -- H/I/J/K applied at finale
);
```

## Supabase Row Level Security (RLS)

```sql
-- Players can read all scores (public leaderboard)
CREATE POLICY "scores_read_all"
  ON player_episode_scores FOR SELECT
  USING (true);

-- Only admins can insert episode scores
CREATE POLICY "scores_admin_insert"
  ON episode_queen_scores FOR INSERT
  USING (
    EXISTS (SELECT 1 FROM players WHERE auth_id = auth.uid() AND is_admin = true)
  );

-- Players can only edit their own team submission, and only when teams are unlocked
CREATE POLICY "team_submit_own_unlocked"
  ON team_submissions FOR INSERT
  USING (
    player_id = (SELECT id FROM players WHERE auth_id = auth.uid())
    AND
    EXISTS (SELECT 1 FROM seasons WHERE id = season_id AND teams_locked = false)
  );
```

## Realtime Subscriptions

The iOS app subscribes to:
```swift
supabase.realtime
  .channel("public:player_episode_scores")
  .on(.insert) { _ in
    // Re-fetch leaderboard + my team scores
  }
  .subscribe()
```

This means the moment admin posts scores, every player's app updates automatically — no polling needed.

## Push Notifications

When admin posts episode scores:
1. Supabase Database Trigger fires → calls Edge Function
2. Edge Function fetches all player APNs tokens
3. Sends push via Apple Push Notification service:
   - "📺 Episode 9 scores are in! Check your standings."

## iOS App Architecture

```
DragRaceFantasy/
├── App/
│   ├── DragRaceFantasyApp.swift     // Entry point, Supabase init
│   └── ContentView.swift            // Root tab view
├── Features/
│   ├── Leaderboard/
│   │   ├── LeaderboardView.swift
│   │   └── LeaderboardViewModel.swift
│   ├── MyTeam/
│   │   ├── MyTeamView.swift
│   │   └── MyTeamViewModel.swift
│   ├── Episodes/
│   │   ├── EpisodesView.swift
│   │   └── EpisodeDetailView.swift
│   ├── Rules/
│   │   └── RulesView.swift
│   ├── Admin/
│   │   ├── AdminView.swift
│   │   └── ScoreEntryView.swift
│   └── Draft/
│       ├── DraftView.swift          // Pre-season only
│       └── DraftViewModel.swift
├── Models/
│   ├── Season.swift
│   ├── Player.swift
│   ├── ShowQueen.swift
│   ├── TeamSubmission.swift
│   └── EpisodeScore.swift
├── Services/
│   ├── SupabaseService.swift        // All DB calls
│   ├── AuthService.swift
│   └── NotificationService.swift
└── Utils/
    ├── ScoringEngine.swift          // Score calculation logic
    └── Extensions.swift
```

## Supabase Free Tier Limits

| Resource | Free Tier | Our Usage (estimate) |
|----------|-----------|---------------------|
| Database | 500 MB | ~5 MB (small tables) |
| Storage | 1 GB | ~0 MB (no files) |
| Bandwidth | 2 GB/mo | ~50 MB/mo |
| Auth users | Unlimited | 14 players |
| Realtime connections | 200 | 14 max concurrent |
| Edge function calls | 500K/mo | ~200/season |

**Verdict:** Free tier is more than sufficient for this use case.
