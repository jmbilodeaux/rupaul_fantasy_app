# 👑 Drag Race Fantasy League

An iOS fantasy league app for RuPaul's Drag Race fans. Players draft a 5-queen team before the season premieres, the league admin inputs weekly episode scores, and the app automatically calculates standings for everyone.

## What's in this repo

```
rupaul_fantasy_app/
├── demo/               ← Interactive UX prototype (open in browser)
│   ├── index.html
│   ├── styles.css
│   ├── data.js         ← All mock data (real scores from CSV)
│   └── app.js          ← App logic
├── PLAN.md             ← Full development plan & tech stack
├── docs/
│   └── architecture.md ← Database schema & system design
└── ios-placeholder/    ← Future SwiftUI project goes here
```

## Running the Demo

Just open `demo/index.html` in any modern browser — no server needed.

```bash
open demo/index.html
# or
open -a "Google Chrome" demo/index.html
```

The demo simulates the full iOS app experience including:
- **Leaderboard** with real episode 1–8 scores from your CSV
- **My Team** view (switch players using the sidebar dropdown)
- **Episodes** — tap any aired episode to see all players' scores
- **Rules** — full scoring reference
- **Admin panel** — try entering Episode 9 scores and posting them

## Tech Stack (Production)

| Layer | Choice | Why |
|-------|--------|-----|
| iOS app | SwiftUI | Native performance, App Store ready |
| Backend | Supabase | Free tier, Realtime, PostgreSQL |
| Auth | Supabase Auth | Magic link / email |
| Push | APNs + Supabase Edge Function | Score alerts |

See [PLAN.md](PLAN.md) for the full development roadmap and [docs/architecture.md](docs/architecture.md) for the database schema.

## Fantasy League Rules

- Players submit a **5-queen team** before Episode 1 airs
- **Teams lock** once Episode 1 airs — no changes allowed
- Admin manually enters episode scores each week (takes ~5 min)
- App auto-calculates all player scores from the queen-level data
- **Pot split:** 🥇 60% · 🥈 25% · 🥉 15% for top 3 players

See the full scoring rules in [PLAN.md](PLAN.md#scoring-rules).
