# Supabase Setup Guide

## What you'll end up with

A free PostgreSQL database at Supabase with:
- All 14 queens, 20 players, and 8 episodes of real data loaded
- An API the app can call to read/write scores
- Auth so players can log in with a magic link (email) — no passwords
- Real-time updates (the moment you post scores, everyone's leaderboard refreshes)

---

## Step 1 — Create a Supabase Project

1. Go to **https://supabase.com** and sign in (free account, no credit card)
2. Click **New Project**
3. Name it: `drag-race-fantasy` (or anything you like)
4. Choose a database password — **save this somewhere**, you'll need it
5. Region: choose the one closest to you (US East / US West)
6. Click **Create new project** and wait ~2 minutes

---

## Step 2 — Run the Schema Migration

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New Query**
3. Open `supabase/migrations/00001_schema.sql` from this repo
4. Paste the entire file contents into the editor
5. Click **Run** — you should see "Success"

---

## Step 3 — Seed the Real Data

1. Click **New Query** again (start a fresh query)
2. Open `supabase/migrations/00002_seed_data.sql` from this repo
3. Paste the entire file contents into the editor
4. Click **Run**
5. You'll see a results table at the bottom — this is the leaderboard sanity check.
   **Expected top results:** Mary Grace ~220 pts, Jordan/Evan ~208 pts, Jill ~198 pts.

If the numbers match — your database is set up correctly!

---

## Step 4 — Get Your API Keys

1. Go to **Project Settings → API** in Supabase
2. Copy two values:
   - **Project URL** — looks like `https://xyzabc.supabase.co`
   - **anon / public key** — a long JWT string
3. You'll paste these into the app config later (iOS app or web app)

> The **service_role key** (also on that page) is secret — never put it in client-side code.
> It's only used in the Edge Function (server-side), which Supabase handles for you.

---

## Step 5 — Enable Email Auth (Magic Links)

1. Go to **Authentication → Providers** in Supabase
2. Make sure **Email** is enabled
3. Under Email, turn ON **"Magic Link"** and turn OFF **"Confirm email"**
   (Magic link = player gets an email with a one-click login, no password needed)
4. Go to **Authentication → URL Configuration**
5. Set **Site URL** to your app URL (for the demo: `https://jmbilodeaux.github.io/rupaul_fantasy_app/`)
6. Add to **Redirect URLs**: `https://jmbilodeaux.github.io/rupaul_fantasy_app/**`

---

## Step 6 — Deploy the Edge Function (for score posting)

You only need this if you're connecting a live app. For now, score posting can be
done directly via the Supabase SQL Editor.

### Option A — Supabase CLI (recommended eventually)

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Login
supabase login

# Link to your project (get project ref from Project Settings → General)
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the Edge Function
supabase functions deploy post-episode-scores
```

### Option B — Enter scores directly in SQL Editor

Until the app is live, you can enter Episode 9 scores like this:

```sql
-- 1. Insert queen codes for ep 9
INSERT INTO episode_queen_scores (season_id, episode, queen_id, codes)
VALUES
  (1, 9, 7,  ARRAY['D','E']),   -- Jane Don't: Maxi win + laugh
  (1, 9, 13, ARRAY['A','B']),   -- Nini Coco: Mini win + safe
  -- ... add all active queens
ON CONFLICT (season_id, episode, queen_id) DO UPDATE SET codes = EXCLUDED.codes;

-- 2. Compute all player scores
SELECT compute_episode_scores(1, 9);

-- 3. Mark episode as aired
UPDATE episodes SET aired = true WHERE season_id = 1 AND number = 9;
UPDATE seasons SET aired_episodes = 9 WHERE id = 1;
```

---

## Step 7 — Link Your Account as Admin

When you sign in to the app, your profile row needs to be linked to your auth account.

1. Sign in to the app (magic link sent to your email)
2. In Supabase: go to **Authentication → Users** — you'll see your new user with a UUID
3. In SQL Editor, run:
   ```sql
   UPDATE players
   SET auth_id = 'YOUR-AUTH-UUID-HERE'   -- paste from Authentication → Users
   WHERE display_name = 'Jill';
   ```
4. Now you're the admin — you can post scores and eliminate queens.

---

## How Other Players Link Their Accounts

When other players sign in:
1. They log in via magic link (you send them the app URL)
2. In Supabase SQL Editor, run:
   ```sql
   UPDATE players
   SET auth_id = 'THEIR-UUID'
   WHERE display_name = 'Mary Grace';
   ```
   (You only need to do this once per person. After linking, they're always recognized.)

> Future improvement: a "Claim your profile" screen in the app where players pick
> their name after signing in. For now, manual linking via SQL editor is fine.

---

## Database at a Glance

| Table | What's in it |
|-------|-------------|
| `seasons` | 1 row — the current RPDR season |
| `show_queens` | 14 queens with eliminated status |
| `scoring_rules` | Codes A–K with point values |
| `players` | 20 real players (auth links pending) |
| `team_submissions` | 20 rows — each player's 5 queens + winner pick |
| `episode_queen_scores` | Codes per queen per episode (admin enters) |
| `player_episode_scores` | Computed points per player per episode |
| `episodes` | 16 episodes with aired status + summaries |

## Free Tier Usage Estimate

| Resource | Limit | Our usage |
|----------|-------|-----------|
| Database | 500 MB | ~5 MB |
| Auth users | Unlimited | 20 |
| Realtime connections | 200 | 20 max |
| Edge function calls | 500K/mo | ~20/season |

Well within free limits for the entire season.
