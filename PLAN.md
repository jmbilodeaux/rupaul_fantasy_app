# Drag Race Fantasy League — App Development Plan

## What We're Building

An iOS app for a RuPaul's Drag Race fantasy league. Players draft a 5-queen team before the season premieres, the league admin inputs weekly scores after each episode, and the app automatically updates standings for all players. A pot of money is split among the top 3 at season's end.

---

## Scoring Rules (from CSV)

| Code | Points | Rule |
|------|--------|------|
| A    | +5     | Mini challenge — top queen |
| B    | +3     | Safe / Lip sync winner |
| C    | +2     | Wig or clothing reveal |
| D    | +10    | Maxi challenge winner |
| E    | +1     | Makes Ru laugh / acrobatic / winning bestie (ep 4) |
| F    | -2     | Relying on that body / loses wig / nip slip |
| G    | -1     | Feuding queens |
| H    | +50    | You specifically picked the season winner |
| I    | +30    | Season winner is on your team (but wasn't your pick) |
| J    | +25    | Miss Congeniality is on your team |
| K    | +20    | Your queen makes the finale |

**Pot split:** 🥇 1st = 60% · 🥈 2nd = 25% · 🥉 3rd = 15%

---

## Tech Stack

### iOS App
- **Language:** Swift
- **UI:** SwiftUI (native iOS look, easy App Store submission)
- **Minimum iOS target:** iOS 16 (covers ~95% of active iPhones)

### Backend (Free Tier)
- **Supabase** (recommended)
  - Free tier: 500MB database, 1GB file storage, 2GB bandwidth/month
  - Built-in Auth (email, magic link, OAuth)
  - Realtime subscriptions — scores push to all users instantly when admin posts
  - PostgreSQL database — easy to query
  - REST + Swift SDK available
  - No credit card required for free tier

### Alternative Backend
- **Firebase** (Firestore + Auth)
  - Also free tier, but Supabase is preferred for relational data

---

## Database Schema (Supabase / PostgreSQL)

```sql
-- Seasons
CREATE TABLE seasons (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,           -- "RuPaul's Drag Race Season 17"
  total_eps   INT  NOT NULL DEFAULT 16,
  aired_eps   INT  NOT NULL DEFAULT 0,
  teams_locked BOOLEAN DEFAULT false,
  pot_per_player INT DEFAULT 10,       -- dollars per player
  pot_split   JSONB DEFAULT '{"first":0.60,"second":0.25,"third":0.15}',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Show queens (the queens competing on the actual show)
CREATE TABLE show_queens (
  id           SERIAL PRIMARY KEY,
  season_id    INT REFERENCES seasons(id),
  name         TEXT NOT NULL,
  nickname     TEXT,
  eliminated   BOOLEAN DEFAULT false,
  eliminated_ep INT,
  color        TEXT DEFAULT '#FF1493'   -- hex color for UI
);

-- Fantasy league players (the people in your friend group)
CREATE TABLE players (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id    UUID REFERENCES auth.users(id),  -- Supabase auth
  display_name TEXT NOT NULL,
  avatar_emoji TEXT DEFAULT '👑'
);

-- Team submissions (each player picks 5 queens + their winner pick)
CREATE TABLE team_submissions (
  id           SERIAL PRIMARY KEY,
  player_id    UUID REFERENCES players(id),
  season_id    INT REFERENCES seasons(id),
  queen_ids    INT[] NOT NULL,          -- array of 5 show_queen IDs
  winner_pick  INT REFERENCES show_queens(id),
  submitted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_id, season_id)
);

-- Episode scores (admin enters codes per show queen per episode)
CREATE TABLE episode_queen_scores (
  id         SERIAL PRIMARY KEY,
  season_id  INT REFERENCES seasons(id),
  episode    INT NOT NULL,
  queen_id   INT REFERENCES show_queens(id),
  codes      TEXT[] NOT NULL,          -- e.g. ['D','E','B']
  entered_at TIMESTAMPTZ DEFAULT now(),
  entered_by UUID REFERENCES players(id),
  UNIQUE(season_id, episode, queen_id)
);

-- Pre-computed fantasy player scores per episode (denormalized for speed)
CREATE TABLE player_episode_scores (
  id         SERIAL PRIMARY KEY,
  player_id  UUID REFERENCES players(id),
  season_id  INT REFERENCES seasons(id),
  episode    INT NOT NULL,
  points     INT NOT NULL DEFAULT 0,
  codes_csv  TEXT,                     -- human-readable code string
  UNIQUE(player_id, season_id, episode)
);
```

---

## How Score Calculation Works

1. Admin opens "Enter Episode Scores" in the app
2. For each show queen still in the competition, admin checks off which codes apply (A–K)
3. App calculates each fantasy player's score:
   ```
   for each fantasy_player:
     episode_score = 0
     for each queen in player.team:
       episode_score += sum of points for all codes assigned to that queen this episode
   ```
4. Results are written to `player_episode_scores`
5. Supabase Realtime broadcasts the update → all players' apps refresh instantly

**This is the key automation:** admin enters data once at the queen level; all 14+ player scores calculate automatically.

---

## App Screens

### 1. Leaderboard (home tab)
- Season progress bar (episodes aired / total)
- Pot display with projected top-3 winnings
- Ranked list of all fantasy players
- Tap player → jump to their team view

### 2. My Team
- Your 5 drafted queens (color-coded dots, status: still in / eliminated)
- Which queen you picked as the winner (H bonus potential)
- Episode-by-episode score breakdown with code chips
- Current rank + projected pot winnings

### 3. Episodes
- List of all episodes (aired = expandable, upcoming = locked)
- Tap aired episode → see summary + all players' scores that episode

### 4. Rules
- Full scoring rules reference
- Pot split explanation
- Season rules (lock date, submission rules)

### 5. Admin Panel (password protected)
- Enter episode scores (show queen → codes → auto-calculates all players)
- Lock/unlock team submissions
- Push notifications to all players
- Season configuration (pot amount, split percentages)

### 6. Team Draft (pre-season only, before ep 1 airs)
- Browse cast of queens
- Select exactly 5 for your team
- Pick your winner
- Submit (locked once episode 1 airs)

---

## Automation Breakdown

| Feature | Manual | Automated |
|---------|--------|-----------|
| Weekly score entry | Admin enters codes per show queen | ✓ |
| Score calculation for all players | | ✓ Auto-calculated from team + codes |
| Leaderboard update | | ✓ Realtime push |
| Score push to all players | | ✓ Supabase Realtime |
| Pot calculation | | ✓ Based on standings |
| Season-end bonuses (H/I/J/K) | | ✓ Auto-applied at finale |
| Team lock enforcement | | ✓ Backend enforced |

---

## Development Phases

### Phase 1 — UX Validation (Now)
- [x] Web demo for UX exploration (this repo)
- [ ] Gather feedback, iterate on screen layouts
- [ ] Finalize all edge cases (tie-breaking, bonus timing)

### Phase 2 — Backend Setup (~1 week)
- [ ] Create Supabase project
- [ ] Run schema migrations
- [ ] Seed season data (queens, players)
- [ ] Test score calculation logic

### Phase 3 — iOS MVP (~3–4 weeks)
- [ ] Xcode project setup (SwiftUI, Supabase Swift SDK)
- [ ] Authentication (magic link or email/password)
- [ ] Leaderboard screen (realtime)
- [ ] My Team screen
- [ ] Episodes screen
- [ ] Admin score entry flow
- [ ] Push notifications (APNs + Supabase Edge Function trigger)

### Phase 4 — Team Draft Flow (~1 week)
- [ ] Queen browser
- [ ] Team selection (exactly 5)
- [ ] Winner pick
- [ ] Submission + lock logic

### Phase 5 — App Store Submission (~1–2 weeks)
- [ ] App icons, screenshots, metadata
- [ ] TestFlight beta (share with league members)
- [ ] App Store review submission
- [ ] Privacy policy (required by Apple)

---

## App Store Notes

- **Category:** Sports (Fantasy Sports subcategory)
- **Age rating:** 12+ (fantasy competition content)
- **Privacy policy:** Required — Supabase stores user emails
- **In-app purchases:** None (pot is handled outside the app via Venmo/cash)
- **Push notifications:** Required for score update alerts
- **Entitlements needed:** Push Notifications, Sign In with Apple (recommended)

---

## Key Design Decisions

### Why Supabase over Firebase?
- Relational database is a much better fit than Firestore's document model
- SQL makes complex queries (rankings, episode aggregates) trivial
- Free tier is generous enough for a small league (14 players, 16 episodes)
- Realtime is built-in, no extra config

### Why SwiftUI over React Native / Flutter?
- Native iOS performance for App Store submission
- No need for cross-platform (android not required)
- Better integration with APNs, HealthKit-style UX patterns
- Smaller binary size, faster App Store review

### Score entry at queen level vs. player level
The current CSV tracks codes per fantasy player. The app will instead track per **show queen**, then auto-compute per fantasy player. This is strictly better:
- Admin enters data once (12 queens) instead of 14 times (14 players)
- Transparent audit trail (you can see exactly why a player got a score)
- Enables future features (queen stats, leaderboard by queen performance)

---

## Questions to Resolve Before Building

1. **Tie-breaking:** What happens if two players have the same total score at season end?
2. **Season-end bonus timing:** When exactly do H/I/J/K get applied? After finale airs?
3. **Late team submissions:** What if someone doesn't submit before ep 1? Do they play with 0 points?
4. **Multiple seasons:** Do we want to track history across seasons?
5. **Pot collection:** Is the buy-in tracked in the app or handled externally?
6. **Admin role:** Single admin, or can any player be designated admin?
