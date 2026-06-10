# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start development server (http://localhost:3000)
npm run build            # Production build
npm run lint             # ESLint
npm run typecheck        # TypeScript type check (no emit)
npm run test             # Run all tests once
npm run test:watch       # Vitest in watch mode
npm run test:coverage    # Tests with coverage report
npm run seed:admin       # Seed initial admin account
```

Run a single test file:
```bash
npx vitest run __tests__/lib/bracket/generate.test.ts
```

## Environment Setup

Copy `.env.local.template` to `.env.local` and fill in:
- `MONGODB_URI` — MongoDB connection string
- `NEXTAUTH_SECRET` — random secret for session signing
- `NEXTAUTH_URL` — base URL (e.g. `http://localhost:3000`)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — seeded admin credentials

## Architecture

**Next.js 15 App Router** with TypeScript, Tailwind CSS, MongoDB/Mongoose, NextAuth.js (credentials), SWR for live polling, and Vitest for testing.

### Route Structure

- `app/(public)/` — unauthenticated pages (home, login, signup, bracket view, stats)
- `app/admin/` — admin pages protected by NextAuth middleware (`middleware.ts`)
- `app/api/` — API routes; admin-only routes live under `app/api/admin/`

### Data Model

All data is in MongoDB. The central model is `lib/models/Tournament.ts`, which contains the full tournament document including embedded `matches[]`. Each match tracks teams, set-by-set scores, status (`pending | in_progress | completed`), bracket position (`winner` or `loser`), and round index.

Supporting models: `User` (admin/tournament_lead/player roles), `PlayerProfile`, `PracticeMatch`, `StatsReset`.

### Bracket Engine (`lib/bracket/`)

The bracket logic is isolated here and is the most complex part of the codebase:

- `generate.ts` — creates all matches for a tournament (double elimination or round-robin) from a team list
- `advance.ts` — called after a match completes; determines which match each team moves to next (winner bracket vs loser bracket transitions)
- `rollback.ts` — reverses an advancement when a score is corrected
- `scheduler.ts` — assigns courts to matches
- `labels.ts` — human-readable round/place labels

### Scoring Flow

`lib/scoring.ts` validates set scores and determines match winners. API route `app/api/tournaments/[id]/matches/[matchId]/scores/route.ts` accepts set scores, saves them, then calls `advance.ts` to propagate results. The `/status` route transitions match state; `/override` allows the admin to override a winner.

### Live Bracket Updates

`PublicTournamentView` and `TournamentManageView` poll the bracket endpoint every 5 seconds via SWR with `refreshInterval`. No WebSockets.

### i18n and Theming

- Locale (English/German) is managed in `lib/i18n.ts` and `components/ui/LocaleProvider.tsx`, persisted in `localStorage`.
- Dark/light theme is managed in `lib/theme.ts` and `components/ui/ThemeProvider.tsx`, persisted in `localStorage`.
- Inline scripts in `app/layout.tsx` apply theme/locale before React hydrates to avoid flash.

### Testing Conventions

- Tests are in `__tests__/`, mirroring the source structure.
- `__tests__/setup/db.ts` sets up an in-memory MongoDB via `mongodb-memory-server` — all API tests use this, not mocks.
- Follow TDD: write failing tests first, then implement.
- Component tests use React Testing Library; bracket/scoring logic tests are pure unit tests.

## Task Tracking

Active tasks are in `Documentation/task.md`. Completed tasks are archived to `Documentation/completed-tasks.md`. Open bugs and feature requests are tracked in `Documentation/open-issues.md`. The roadmap lives in `Documentation/roadmap.md`.
