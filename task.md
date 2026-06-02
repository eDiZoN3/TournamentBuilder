# Tournament Builder — Task List

Reference documents: plan.md (architecture + models), specify.md (product spec), techplan.md (algorithms + edge cases).

Each task is atomic enough for a single coding session. TDD tasks write tests first, then implementation. Dependencies listed as task IDs.

---

## Phase 0 — Project Setup & Test Infrastructure

### T01 — Scaffold Next.js Project
**Files**: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`, `.env.local.template`
**Depends on**: —
**Description**: Initialize Next.js 14+ with App Router, TypeScript, Tailwind CSS. Install all production and dev dependencies: `mongoose`, `next-auth`, `bcryptjs`, `swr`. Dev deps: `vitest`, `@vitest/coverage-v8`, `mongodb-memory-server`, `@testing-library/react`, `@testing-library/jest-dom`, `node-mocks-http`.

---

### T02 — Vitest Configuration
**Files**: `vitest.config.ts`, `vitest.setup.ts`
**Depends on**: T01
**Description**: Configure Vitest with `globals: true`, `environment: 'node'`, `setupFiles`. Wire up `@testing-library/jest-dom` matchers in setup file. Add `test`, `test:watch`, `test:coverage` scripts to `package.json`.

---

### T03 — Test Database Setup
**Files**: `__tests__/setup/db.ts`, `__tests__/helpers/factories.ts`
**Depends on**: T02
**Description**: Implement `beforeAll`/`afterEach`/`afterAll` hooks using `mongodb-memory-server` and `mongoose`. Create factory helper functions: `makeTeams(n)`, `makeTournament(overrides?)`, `makeMatch(overrides?)`, `makeSet(a, b)`. Verify: `vitest run` passes with 0 tests (no failures on empty run).

---

## Phase 1 — Foundation

### T04 — Mongoose Connection
**Files**: `lib/db.ts`
**Depends on**: T01
**Description**: Singleton Mongoose connection that reuses existing connection if already established. Reads `MONGODB_URI` from environment. Export `connectDB()`.

---

### T05 — User Model
**Files**: `lib/models/User.ts`
**Depends on**: T04
**Description**: Mongoose model with `email`, `passwordHash`, `role: 'admin'`. Add unique index on `email`.

---

### T06 — NextAuth Credentials Provider
**Files**: `app/api/auth/[...nextauth]/route.ts`, `lib/auth.ts`
**Depends on**: T05
**Description**: Configure NextAuth with Credentials provider. Authenticate by querying User model and verifying bcrypt hash. Set session strategy to `jwt`. Export `authOptions` for use in middleware and API routes.

---

### T07 — Admin Seed Script
**Files**: `scripts/seed-admin.ts`
**Depends on**: T05
**Description**: Connect to MongoDB, check if admin exists, hash password with bcrypt (rounds=12), insert User. Read email/password from `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars. Disconnect cleanly. Run via `npx tsx scripts/seed-admin.ts`.

---

### T08 — Route Protection Middleware
**Files**: `middleware.ts`
**Depends on**: T06
**Description**: Protect all `/admin/**` routes except `/admin/login`. Redirect unauthenticated requests to `/admin/login?callbackUrl=<original>`. Use NextAuth's `withAuth` or manual JWT check.

---

### T09 — App Layouts and Navigation
**Files**: `app/layout.tsx`, `app/(public)/layout.tsx`, `app/admin/layout.tsx`, `components/ui/Navbar.tsx`, `components/ui/AdminSidebar.tsx`
**Depends on**: T08
**Description**: Root layout (fonts, global CSS). Public layout with nav showing tournament list link. Admin layout with sidebar (Dashboard, logout). Conditional rendering based on session.

---

### T10 — Login Page
**Files**: `app/admin/login/page.tsx`
**Depends on**: T06
**Description**: Email + password form. On submit calls `signIn('credentials', {...})`. On success redirects to `/admin/dashboard` or `callbackUrl`. Shows inline error on invalid credentials.

---

## Phase 2 — Scoring Logic (TDD First)

### T11 — Scoring Tests (write first)
**Files**: `__tests__/lib/scoring.test.ts`
**Depends on**: T03
**TDD**: Write tests before implementation
**Description**: Test all 14 rows of the validateSet truth table (see techplan.md §6), including decimal inputs, negative scores, large valid scores, deuce cases. Test `determineSetWinner`. Test `determineMatchWinner` for BO1 and BO3 (all 7 BO3 table rows from plan.md §4c). Test re-entry clearing: entering setIndex=0 after 3 sets clears 2 subsequent sets.

---

### T12 — Scoring Implementation
**Files**: `lib/scoring.ts`
**Depends on**: T11
**TDD**: Make T11 tests pass
**Description**: Implement `validateSet(scoreA, scoreB): SetValidation`, `determineSetWinner(scoreA, scoreB): 'A'|'B'`, `determineMatchWinner(sets, format): 'A'|'B'|null`. Export all three. Coverage target: ≥ 90%.

---

## Phase 3 — Tournament CRUD

### T13 — Tournament Model
**Files**: `lib/models/Tournament.ts`
**Depends on**: T04
**Description**: Full Mongoose schema matching plan.md data model. Embedded `Team[]` and `Match[]` arrays. Include `courtsAvailable`, `currentMatchIds`, `status`. Add index on `status` field. Export `Tournament` model and TypeScript interfaces `ITournament`, `ITeam`, `IMatch`, `ISetScore`.

---

### T14 — Tournaments List & Create API
**Files**: `app/api/tournaments/route.ts`, `__tests__/api/tournaments.test.ts`
**Depends on**: T13, T03
**TDD**: Write tests before/alongside implementation
**Description**:
- `GET /api/tournaments` → returns `{ tournaments: [...] }` with fields per techplan.md §4.
- `POST /api/tournaments` → validates name (≤100 chars), teamSize (2|3|4), courtsAvailable (1–10), inputMode. Creates tournament with status `draft`. Returns 201.
- Tests: list empty, list with multiple, create valid, create with invalid teamSize, create with courtsAvailable=0 (rejected), auth guard on POST.

---

### T15 — Tournament Get, Update, Delete API
**Files**: `app/api/tournaments/[id]/route.ts`
**Depends on**: T14
**Description**:
- `GET /api/tournaments/[id]` → full tournament with teams and matches (public).
- `PUT /api/tournaments/[id]` → admin only; allows updating `name` only (status changes are not user-facing).
- `DELETE /api/tournaments/[id]` → admin only; only allowed when `status === 'draft'`; returns 409 CONFLICT otherwise.
- Tests: get non-existent (404), delete active tournament (409), delete draft (204), get returns full match array.

---

### T16 — Player Auto-Assignment Logic
**Files**: `lib/bracket/playerAssign.ts`, `__tests__/lib/playerAssign.test.ts`
**Depends on**: T03
**TDD**: Write tests before implementation
**Description**: `assignPlayersToTeams(players: string[], teamSize: 2|3|4): Team[]`. Fisher-Yates shuffle → chunk into teams → append remainder to last team. Tests: even split (8 players, size 2 → 4 teams of 2), remainder (7 players, size 3 → teams of 3 and 4), single leftover (5 players, size 4 → teams of 4 and 5). Minimum team validation: reject if resulting in < 2 players per team.

---

### T17 — New Tournament Page
**Files**: `app/admin/tournament/new/page.tsx`
**Depends on**: T14, T09
**Description**: Form with: tournament name (text), team size (radio 2/3/4), courts available (number input, min 1 max 10), input mode (radio: teams/players). On submit: POST to `/api/tournaments`, redirect to `/admin/tournament/[id]/setup`.

---

### T18 — Tournament Setup Page
**Files**: `app/admin/tournament/[id]/setup/page.tsx`
**Depends on**: T17, T16
**Description**:
- **Team mode**: dynamic list of team name inputs. Add/remove rows. Validate min 2 teams and no empty names.
- **Player mode**: dynamic list of player name inputs. "Generate Teams" button → preview of auto-assigned teams. Shuffle button → regenerate. Team name editing in preview. Warning if player count not evenly divisible.
- "Start Tournament" button: validates, POSTs to `/api/tournaments/[id]/start`, redirects to manage page.

---

## Phase 4 — Bracket Generation (TDD First)

### T19 — Bracket Label Tests (write first)
**Files**: `__tests__/lib/bracket/labels.test.ts`
**Depends on**: T03
**TDD**: Write tests before implementation
**Description**: Test `computeLabel` and `computePlaceRange` for: 4-team bracket (all match types), 8-team bracket (all match types), 16-team bracket (spot check). Test LB elimination place ranges per techplan.md §13 table. Test isWBFinal and isLBFinal detection. Test 3-team bracket (LB match gets "3rd Place").

---

### T20 — Bracket Label Implementation
**Files**: `lib/bracket/labels.ts`
**Depends on**: T19
**TDD**: Make T19 tests pass
**Description**: Implement `computeLabel(bracket, round, totalWBRounds, isWBFinal, isLBFinal): string` and `computePlaceRange(bracket, round, isWBFinal, isLBFinal, teamCount, bracketSize): string`. Use techplan.md §13 algorithm.

---

### T21 — Bracket Generation Tests (write first)
**Files**: `__tests__/lib/bracket/generate.test.ts`
**Depends on**: T03, T20
**TDD**: Write tests before implementation
**Description**: For each bracket size (4, 8, 16 teams) and non-power-of-2 (3, 5, 6, 7 teams):
- Correct total match count (techplan.md §2 table)
- WB R1 pairs match seeding algorithm (1v4, 2v3 for B=4; etc.)
- LB R1 cross-pairing correct (L1 vs L4, L2 vs L3 for 8-team)
- LB feed-in pairing correct (reversed WB losers vs LB winners)
- All `winnerNextMatchId` and `loserNextMatchId` connections are valid (point to existing matches)
- All `isWBFinal` and `isLBFinal` flags set on correct matches
- BO3 format assigned to last 2 WB rounds and LB Final; BO1 elsewhere
- Bye matches auto-completed with correct winnerId
- Lucky Loser propagation: WB R1 bye → LB R1 slot also bye

---

### T22 — Bracket Generation Implementation
**Files**: `lib/bracket/generate.ts`
**Depends on**: T21
**TDD**: Make T21 tests pass
**Description**: Implement `generateBracket(teams: ITeam[], courtsAvailable: number): IMatch[]`.
1. `generateSeedPositions(B)` — recursive seeding pairs algorithm (techplan.md §1)
2. Build WB R1 matches with team/bye assignment
3. Build remaining WB rounds with winnerNextMatchId wiring
4. Build LB rounds (R1 feed-in, alternating feed-in/pure, LB Final) with full connection wiring
5. Assign `isWBFinal`, `isLBFinal`
6. Assign format via BO3 rule (last 2 WB rounds + LB Final)
7. Assign labels and placeRange via `labels.ts`
8. Process bye matches: call `advance()` for each `isBye` match

---

### T23 — Bracket Advance Tests (write first)
**Files**: `__tests__/lib/bracket/advance.test.ts`
**Depends on**: T03, T22
**TDD**: Write tests before implementation
**Description**:
- Winner routed to correct slot in next match (A and B slots)
- Loser routed to correct LB slot
- WB Final: winner gets 1st, loser gets 2nd, no loserNextMatchId
- LB Final: winner gets 3rd, loser gets 4th, no loserNextMatchId
- After match completion, next match status set to `ready` when both slots filled
- Court assignment: `currentMatchIds` updated, court number assigned
- Court limit enforced: cannot exceed `courtsAvailable`
- Tournament completion: all non-bye matches completed → tournament.status = 'completed'
- `tournamentCompleted: true` returned in response

---

### T24 — Bracket Advance Implementation
**Files**: `lib/bracket/advance.ts`
**Depends on**: T23
**TDD**: Make T23 tests pass
**Description**: Implement `onMatchComplete(tournament: ITournament, match: IMatch): void`. Routes winner and loser to next matches. Updates `currentMatchIds`. Checks tournament completion. Implement `assignCourt(tournament, match): number` (lowest unused court). Implement `canMarkInProgress(tournament): boolean` (court count check).

---

### T25 — Start Tournament API + Tests
**Files**: `app/api/tournaments/[id]/start/route.ts`, `__tests__/api/start.test.ts`
**Depends on**: T22, T15
**TDD**: Write tests alongside implementation
**Description**: `POST /api/tournaments/[id]/start` — validate tournament is draft, validate ≥ 2 teams, call `generateBracket()`, save matches to tournament, set status to `active`. Response: `{ tournamentId, matchesGenerated, byeCount }`. Tests: 4-team, 8-team, 3-team (non-power-of-2), start already-active tournament (409), start with 1 team (422).

---

## Phase 5 — Bracket Visualization

### T26 — MatchCard Component + Tests
**Files**: `components/bracket/MatchCard.tsx`, `__tests__/components/MatchCard.test.tsx`
**Depends on**: T13
**TDD**: Write tests alongside implementation
**Description**: Renders a single match tile. All 4 status states (pending: greyed/TBD, ready: neutral, in_progress: pulsing gold border + LIVE badge + court number pill, completed: winner bold green / loser dim). BO3: shows up to 3 set columns (only played sets shown). Bye match: shows real team + "—" opponent, completed styling. Court badge: visible only when in_progress. Tests: render each status, verify court badge hidden when not in_progress, verify bye display.

---

### T27 — WinnerBracket Component
**Files**: `components/bracket/WinnerBracket.tsx`
**Depends on**: T26
**Description**: Grid layout where each column is a WB round. Renders MatchCard for each WB match. Positions cards vertically within each round column. Accepts `matches: IMatch[]`, `teams: ITeam[]` as props. Resolves team names from team IDs for display.

---

### T28 — LoserBracket Component
**Files**: `components/bracket/LoserBracket.tsx`
**Depends on**: T26
**Description**: Same grid approach as WinnerBracket but for LB matches. Handles alternating feed-in and pure rounds (same column count logic). Renders "LB Final" prominently at the end.

---

### T29 — SVG Connector Lines
**Files**: `components/bracket/ConnectorLines.tsx`
**Depends on**: T27, T28
**Description**: Draws SVG lines connecting match cards to their next matches. Uses absolute positioning + ResizeObserver to recalculate line coordinates when layout changes. Lines are drawn between the right edge of a match card and the left edge of the next match card. Highlight lines for in_progress match connections.

---

### T30 — BracketView (Full Layout) + Up Next Banner
**Files**: `components/bracket/BracketView.tsx`, `components/bracket/UpNextBanner.tsx`
**Depends on**: T27, T28, T29
**Description**: Combines WB + LB with ConnectorLines. Desktop: side-by-side WB and LB. Tablet: horizontal scroll container. Mobile: tab switcher (Winner / Loser tabs). `UpNextBanner`: shows up to 3 ready non-bye matches sorted per techplan.md §7. Hidden when empty.

---

### T31 — Public Bracket Page
**Files**: `app/(public)/tournament/[id]/page.tsx`
**Depends on**: T30
**Description**: Server-renders initial bracket data. Client: SWR polling every 5s. Stop polling when `tournament.status === 'completed'`. Show tournament name + status badge. Show "Tournament Complete" overlay with final standings when completed. Handle tournament not found (404 page).

---

### T32 — Public Tournament List Page
**Files**: `app/(public)/page.tsx`
**Depends on**: T14
**Description**: Lists all tournaments with name, status badge (Draft/Active/Completed), creation date. Links to bracket view. Empty state: "No tournaments yet." Server component, no polling needed.

---

## Phase 6 — Score Entry & Advancement (TDD First)

### T33 — Scores API + Tests
**Files**: `app/api/tournaments/[id]/matches/[matchId]/scores/route.ts`, `__tests__/api/scores.test.ts`
**Depends on**: T12, T24, T03
**TDD**: Write tests before implementation
**Description**: `PUT /api/tournaments/[id]/matches/[matchId]/scores`. Full implementation per techplan.md §4 (scores endpoint). Tests:
- Valid set accepted, correct pointsToWin returned
- Invalid score rejected with VALIDATION_ERROR
- setIndex out of bounds rejected
- setIndex skipping a set rejected
- Re-entry at setIndex=0 clears subsequent sets
- Re-entry response includes `clearedSets` count
- BO1: only setIndex=0 accepted
- Match in wrong status (pending/completed) rejected with CONFLICT
- Auth guard

---

### T34 — Match Status API + Tests
**Files**: `app/api/tournaments/[id]/matches/[matchId]/status/route.ts`, `__tests__/api/status.test.ts`
**Depends on**: T24, T03
**TDD**: Write tests before implementation
**Description**: `PUT /api/tournaments/[id]/matches/[matchId]/status`. Tests:
- Mark in_progress: assigns court, adds to currentMatchIds, response includes courtNumber
- Mark in_progress when courts full: 409 CONFLICT
- Mark in_progress on non-ready match: 409 CONFLICT
- Confirm completed: winner determined, loser routed, court freed, courtNumber=null
- Confirm completed with no sets: 422 VALIDATION_ERROR
- Confirm completed with undetermined winner (1-0 in BO3): 422 VALIDATION_ERROR
- Tournament completion: when last non-bye match confirmed, response has tournamentCompleted=true
- Auth guard

---

### T35 — ScoreEntry Modal Component + Tests
**Files**: `components/admin/ScoreEntry.tsx`, `__tests__/components/ScoreEntry.test.tsx`
**Depends on**: T12, T26
**TDD**: Write tests alongside implementation
**Description**: Modal for entering match scores.
- BO1: 1 score row (Team A | Team B inputs). "Confirm Match" button appears once valid scores entered.
- BO3: up to 3 set rows. Set N+1 locked (disabled) until set N has valid saved scores. Re-entry allowed on any prior set (clears subsequent set rows in UI).
- Inline validation error shown below inputs using `validateSet` client-side before API call.
- "Confirm Match" visible only when `matchWinner !== null`.
- Calls scores API on "Save Set N"; calls status API on "Confirm Match".
- Tests: BO1 confirm button appears after valid entry, hidden after invalid; BO3 set 2 locked until set 1 saved; re-entry clears set 2 UI; confirm button hidden when match not won; validation error shown for 11:10.

---

### T36 — MatchControls Component
**Files**: `components/admin/MatchControls.tsx`
**Depends on**: T34, T35
**Description**: Admin-only controls per match card. "Mark as In Progress" button — disabled and shows tooltip "All courts occupied" when `currentMatchIds.length >= courtsAvailable`. "Enter Scores" button — opens ScoreEntry modal. Shown only for `ready` and `in_progress` matches. Bye matches: no controls shown.

---

### T37 — Admin Manage Page
**Files**: `app/admin/tournament/[id]/manage/page.tsx`
**Depends on**: T30, T36
**Description**: Full BracketView plus admin controls. Each MatchCard overlays MatchControls on hover (desktop) or below the card (mobile). SWR polling same as public view. Shows "Tournament Complete" banner with standings when done. Top bar shows current court status (e.g. "2/3 courts in use").

---

### T38 — Admin Dashboard Page
**Files**: `app/admin/dashboard/page.tsx`
**Depends on**: T14, T09
**Description**: Lists all tournaments with status badges and actions: Setup (draft), Manage (active), View (any), Delete (draft only). "Create New Tournament" button. Empty state. Delete confirmation inline (no modal needed — just a second click on "Confirm Delete" that replaces the Delete button).

---

## Phase 7 — Polish & Production

### T39 — Error & Empty States
**Files**: `components/ui/Toast.tsx`, `components/ui/ErrorBanner.tsx`, `components/ui/EmptyState.tsx`
**Depends on**: T09
**Description**: Toast system (context + hook `useToast()`). Auto-dismiss after 5s. Types: success (green), error (red), info (blue). `ErrorBanner` for SWR fetch failures (non-blocking, dismissible). `EmptyState` reusable component for empty lists.

---

### T40 — Loading Skeletons
**Files**: `components/bracket/MatchCardSkeleton.tsx`, `components/ui/Skeleton.tsx`
**Depends on**: T26
**Description**: Skeleton loaders for bracket view during initial SWR load. MatchCardSkeleton mimics MatchCard dimensions. Show skeletons when `isLoading && !data`.

---

### T41 — Tournament Completed Screen
**Files**: `components/bracket/StandingsTable.tsx`
**Depends on**: T30
**Description**: Shown when `tournament.status === 'completed'`. Displays final placements: 1st through 4th (and further for larger brackets) with team names and player names. Derived from `winnerId`/`loserId` on `isWBFinal` and `isLBFinal` matches, and from LB elimination round ordering.

---

### T42 — Deployment Configuration
**Files**: `.env.local.template`, `vercel.json` (if needed), `README.md` (setup instructions only)
**Depends on**: all prior tasks
**Description**: `.env.local.template` with all required vars. Verify `MONGODB_URI` connection string works with MongoDB Atlas. Set `NEXTAUTH_URL` to production domain. Verify middleware protects admin routes in Vercel serverless environment. Run `vitest run --coverage` and confirm coverage targets met before deploying.

---

## Task Dependency Summary

```
T01 → T02 → T03 (test infra complete)
T01 → T04 → T05 → T06 → T07
                 → T08 → T09 → T10
T03 → T11 → T12 (scoring complete)
T04 → T13 → T14 → T15 → T17 → T18
                        → T16
T03 → T19 → T20
T03 → T21 → T22 (bracket generation complete)
T03 → T23 → T24 (advance complete)
T22, T15 → T25 (start API complete)
T13, T26 → T27, T28 → T29 → T30 → T31, T32
T12, T24, T03 → T33, T34
T12, T26 → T35 → T36 → T37 → T38
T09 → T39 → T40 → T41 → T42
```

---

## Estimated Task Count by Phase

| Phase | Tasks | Notes |
|---|---|---|
| 0 — Setup | 3 | Must complete before anything else |
| 1 — Foundation | 7 | Admin auth + layouts |
| 2 — Scoring (TDD) | 2 | Most critical logic; full truth table |
| 3 — Tournament CRUD | 6 | DB models + create/setup flow |
| 4 — Bracket Gen (TDD) | 7 | Highest complexity; most tests |
| 5 — Visualization | 7 | UI components |
| 6 — Score Entry (TDD) | 6 | API + UI for running matches |
| 7 — Polish | 4 | Error states, skeletons, deploy |
| **Total** | **42** | |
