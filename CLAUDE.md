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

All data is in MongoDB. The central model is `lib/models/Tournament.ts`, which contains the full tournament document including embedded `matches[]`. Each match tracks teams, set-by-set scores, status (`pending | ready | in_progress | completed`), bracket position (`winner` or `loser`), and round index.

Supporting models: `User` (admin/tournament_lead/player roles), `PlayerProfile`, `PracticeMatch`, `StatsReset`.

### Tournament formats and match modes

Several `Tournament` fields together decide how a tournament generates, renders, and scores — they cut across the model, the create/start APIs, the bracket engine, and the views:

- `format`: `double_elimination | team_round_robin | individual_mixer | event`. This selects the start-route generator (`generateBracket`, `generateTeamRoundRobinSchedule`, `generateIndividualMixerSchedule`, `generateEventTournamentMatches`) **and** the view: `TournamentManageView`/`PublicTournamentView` render `BracketView` (knockout), `RoundRobinView` (non-knockout, via `isNonKnockoutFormat`), or `EventTournamentView` (event).
- `matchResultMode`: `points | winner_only`. Winner-only records only who won — no score entry — everywhere. In a winner-only bracket, clicking a team row in the tree completes the match directly (`MatchCard` `onSelectWinner` → status route auto-starts a `ready` match); the two-step "mark in progress" flow still exists in the controls overlay. Events are always winner-only.
- `knockoutMatchFormat` (`bo3_semis_finals | bo1`) and `roundRobinMatchFormat` (`bo1 | bo3`) control per-match set count; winner-only forces `bo1`.
- `teamSize` is any integer in `[MIN_TEAM_SIZE, MAX_TEAM_SIZE]` (not a fixed 2/3/4 enum).

Creation is validated in `app/api/tournaments/route.ts` (`parseCreateBody`); the roster/setup UI is `components/admin/TournamentSetupForm.tsx`, and `app/api/tournaments/[id]/start/route.ts` turns a draft roster into matches.

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

#### Per-tournament visual themes (skins)

Separate from dark/light, each tournament has a visual **theme** (`default`, `knight`, …) that only changes its *look*, never its behaviour.

- The registry is `lib/tournamentTheme.ts` — adding a theme is additive (one entry + i18n labels + one CSS file).
- The theme is stored on the `Tournament` document (`theme` field) and chosen via the dropdown in the admin manage view (`components/admin/TournamentThemePicker.tsx`, persisted through `PUT /api/tournaments/[id]`).
- `TournamentManageView` and `PublicTournamentView` set `data-tournament-theme="<id>"` on their wrapper `<section>`. The matching CSS lives in `app/themes/` (one file per theme, aggregated by `app/themes/index.css`, imported in `app/layout.tsx`). Theme rules are scoped to that attribute and prefixed with `:root` so they override the global dark-mode rules regardless of light/dark.
- A theme remaps Tailwind utility classes; because base classes (e.g. `bg-slate-900`) win over `dark:` variants at the theme's `:root [attr] .class` specificity, an inverted dark surface and its `text-white` label are both remapped. Keep these in step — `text-white` must map to a *light* tincture (it only ever sits on a dark surface), never to ink, or you get unreadable dark-on-dark labels.

##### Team crests (knight theme)

- The knight theme draws a heraldic shield next to each team in the **team stats table** (`components/stats/StatsTable.tsx`, via the `showCrests` prop set by `TournamentStats`) — not in the bracket/graph. Crest data (`field`, `division`, `divisionColor`, `charge`, `chargeColor` — all tincture/shape ids) lives on each `ITeam` (`crest` field) regardless of theme; pure logic, palettes, a deterministic per-team default, and a WCAG contrast guard are in `lib/crest.ts`.
- `components/bracket/CrestShield.tsx` renders the SVG; `TeamCrest.tsx` is a context-aware wrapper that shows nothing unless the theme is `knight` (gated by `CrestProvider`, mounted in both tournament views) and becomes an editor trigger when the provider is `editable` (admin manage view). It resolves a team by id or by name (stats rows only carry the team name, so `CrestProvider` exposes a `teamsByName` map). The editor is `CrestEditor.tsx`; crests persist via `PUT /api/tournaments/[id]/teams/[teamId]/crest` (admin-only, allowed in any status).

### Testing Conventions

- Tests are in `__tests__/`, mirroring the source structure.
- `__tests__/setup/db.ts` sets up an in-memory MongoDB via `mongodb-memory-server` — all API tests use this, not mocks.
- Follow TDD: write failing tests first, then implement (required — see Conventions).
- Component tests use React Testing Library; bracket/scoring logic tests are pure unit tests.
- Several creation/setup component tests assert the exact `JSON.stringify` request body; when changing the create payload, update those expectations in lockstep (`__tests__/components/NewTournamentPage.test.tsx`).

## Conventions

From `agents.md`: TDD is mandatory (tests before implementation), prefer small surgical changes over broad refactors, and follow App Router conventions — React Server Components by default, add `'use client'` only where hooks or browser APIs are needed. Before considering work done, run `npm run lint`, `npm run typecheck`, and `npm run test` (CI parity; the README also lists `npm run build`).

## Planning Docs & Task Tracking

These markdown files live at the **repository root** (there is no `Documentation/` directory):

- `task.md` — active tasks; `completed-tasks.md` — archived completed tasks.
- `open-issues.md` / `issues.md` — open bugs and feature requests; `implemented-issues.md` — resolved.
- `roadmap.md` / `implemented-roadmap.md` — roadmap and shipped items.
- `plan.md`, `techplan.md`, `specify.md`, `group-seeding-algorithm.md` — design/spec notes.
- `agents.md` — concise AI-agent briefing.

## API Reference

REST routes live under `app/api/`. An OpenAPI document is served at `/api/openapi` (defined in `lib/openapi.ts`) with Swagger UI at `/api-docs`.
