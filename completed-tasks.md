# Tournament Builder - Completed Tasks

Archived from `task.md` to keep active planning token-efficient. These tasks are treated as implemented.

# Tournament Builder — Task List

Reference documents: plan.md (architecture + models), specify.md (product spec), techplan.md (algorithms + edge cases).

Each task is atomic enough for a single coding session. TDD tasks write tests first, then implementation. Dependencies listed as task IDs.

---

## Phase 17 — Open Issue Fixes (Issues 32–34)

### T133 — Remove Pulsating Animation from Live Match Cards [COMPLETED]
**Files**: `components/bracket/MatchCard.tsx`, `__tests__/components/MatchCard.test.tsx`
**Description**: Removed `animate-pulse` from live match cards entirely (including the `isPinned` conditional that was only there to suppress the pulse). Amber border/ring styling kept as the live indicator. Updated 3 tests (tests renamed; now assert `not.toHaveClass("animate-pulse")` and `toHaveClass("border-amber-400")` in both pinned and unpinned states). All 15 MatchCard tests pass.

---

## Phase 16 — Open Issue Fixes (Issues 29–31)

### T129 — Fix "Mark as In Progress" in Winner-Only Tournaments [COMPLETED]
**Files**: `lib/bracket/advance.ts`, `lib/bracket/scheduler.ts`, `components/admin/MatchControls.tsx`, `__tests__/lib/bracket/advance.test.ts`, `__tests__/lib/bracket/scheduler.test.ts`
**Description**: `canMarkInProgress` and `assignCourt` now bypass the court-capacity guard for `winner_only` tournaments. `assignCourt` sets `courtNumber = null` and proceeds without checking occupied courts. `autoAssignReadyMatches` returns immediately with no assignments for `winner_only` (admin picks manually). `MatchControls` computes `courtsFull = false` when `matchResultMode === "winner_only"`. 3 new advance tests, 1 new scheduler test, all passing.

### T130 — Fix JWT Token Refresh After Password Change [COMPLETED]
**Files**: `lib/auth.ts`, `app/admin/change-password/page.tsx`, `__tests__/lib/auth.test.ts`, `__tests__/components/ChangePasswordPage.test.tsx`
**Description**: JWT callback now handles `trigger === "update"` — sets `token.mustChangePassword = false` when the session payload includes `mustChangePassword: false`. Change-password page calls `updateSession({ mustChangePassword: false })` from `useSession()` before navigating, replacing the ineffective `router.refresh()`. 2 new auth tests, component tests updated to mock `useSession` and assert `update` is called instead of `refresh`. All passing.

## Phase 14 — Remaining Roadmap and Issue Backlog

### T107 — Score Entry Modal Foreground Opacity Polish [COMPLETED]
**Files**: `components/bracket/MatchCard.tsx`, `__tests__/components/MatchCard.test.tsx`
**Description**: Removed `animate-pulse` from live match cards when `isPinned=true` (score entry open). Amber border and ring styling retained so in-progress status remains visible. Two new tests verify the suppression when pinned and retention when not pinned. All 518 tests pass.

### T108 — Localized Bracket Labels and Place Ranges [COMPLETED]
**Files**: `lib/bracket/labels.ts`, `components/bracket/MatchCard.tsx`, `components/bracket/WinnerBracket.tsx`, `components/bracket/LoserBracket.tsx`, `__tests__/lib/bracket/labels.test.ts`, `__tests__/components/MatchCard.test.tsx`, `__tests__/components/Localization.test.tsx`
**Description**: Added `localizeLabel` and `localizePlaceRange` helpers to `labels.ts`. Match card headers and round headings in WinnerBracket/LoserBracket now render localized labels at display time (e.g. "WB Semi-Final" → "Semi-Final"/"Halbfinale", "WB Final" → "Final"/"Finale", "LB Final" → "LB Final"/"LB-Finale"). Place ranges convert to German ordinal format ("1st-2nd Place" → "1.-2. Platz"). Stored labels remain unchanged for backward compatibility. 22 new tests, all 540 tests pass.

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

---

## Phase 8 - Testing Feedback, Usability, and Stats

This phase documents the implemented feedback items 1-9 from `implemented-issues.md`. It extends the completed Phase 0-7 baseline without changing the historical task list above.

### Issue Resolution Plan

| Issue | Resolution Tasks | Notes |
|---|---|---|
| 1. Active match selection should be automatic but overridable | T43, T44, T45 | Add backend scheduling first, then expose manual court overrides in admin UI. |
| 2. Score entry card should stay foreground and not depend on hover | T46 | Pin the active match card/control layer while score entry is open. |
| 3. Winner-to-loser bracket connector lines reduce readability | T47 | Keep connector lines only inside the same bracket. |
| 4. Admin needs tournament deletion | T48 | Extend deletion beyond draft tournaments with safer confirmation for active/completed tournaments. |
| 5. Completed match result must be overridable | T49, T50, T51 | Implement rollback/replay logic before adding API and UI. |
| 6. Public team/player stats per tournament and across seasons | T52, T53, T54 | Stats are system-calculated from stored tournaments and matches. |
| 7-9. Bracket layout/readability on larger and mobile brackets | T55, T56 | Stack brackets below 1400px and add round-level mobile navigation. |

### T43 - Auto Match Scheduler Logic (TDD First)
**Files**: `lib/bracket/scheduler.ts`, `__tests__/lib/bracket/scheduler.test.ts`
**Depends on**: T24, T30
**TDD**: Write tests before implementation
**Description**: Implement automatic match selection for free courts. The scheduler:
- Finds ready, non-bye matches using the same priority as the Up Next banner: winner bracket before loser bracket, then earlier round and position.
- Assigns the lowest available court numbers.
- Fills up to `courtsAvailable` without exceeding court capacity.
- Ignores pending, completed, bye, and already in-progress matches.
- Returns `{ autoStartedMatches, assignedCourts }` for API responses and UI refreshes.

Tests: empty ready list, one free court, multiple free courts, already occupied courts, no over-assignment, WB-before-LB priority, byes ignored.

---

### T44 - Auto Scheduling API Integration (TDD First)
**Files**: `app/api/tournaments/[id]/start/route.ts`, `app/api/tournaments/[id]/matches/[matchId]/status/route.ts`, `__tests__/api/start.test.ts`, `__tests__/api/status.test.ts`
**Depends on**: T43
**TDD**: Write tests before implementation
**Description**: Wire automatic scheduling into tournament lifecycle:
- After starting a tournament, automatically assign initial ready matches to available courts.
- After confirming a completed match, automatically fill newly freed courts with the next ready matches.
- Include `autoStartedMatches` in start/status responses.
- Keep existing manual "mark as in progress" behavior available for admins.

Tests: tournament start auto-fills courts, completion auto-starts next ready match, no auto-start when tournament is completed, no auto-start when all courts occupied, response shape includes auto-start details.

---

### T45 - Manual Court Override API and Controls (TDD First)
**Files**: `app/api/tournaments/[id]/matches/[matchId]/court/route.ts`, `components/admin/CourtOverrideControls.tsx`, `components/admin/MatchControls.tsx`, `__tests__/api/court.test.ts`, `__tests__/components/CourtOverrideControls.test.tsx`
**Depends on**: T44
**TDD**: Write tests before implementation
**Description**: Allow admins to override automatic active-match selection:
- Admin can assign a ready match to a selected court.
- If the selected court is already occupied, the currently occupying match is returned to `ready`, its `courtNumber` is cleared, and the selected match becomes `in_progress`.
- Admin can move an in-progress match to a different free court.
- All overrides respect `courtsAvailable` and are admin-only.
- UI shows a court selector and confirmation text when replacing an occupied court.

Tests: assign ready match to free court, replace occupied court, move in-progress match, reject invalid court number, reject pending/completed/bye match, auth guard, UI confirmation flow.

---

### T46 - Pinned Score Entry Card State
**Files**: `components/bracket/MatchCard.tsx`, `components/admin/MatchControls.tsx`, `components/admin/ScoreEntry.tsx`, `components/admin/TournamentManageView.tsx`, `__tests__/components/MatchCard.test.tsx`, `__tests__/components/MatchControls.test.tsx`
**Depends on**: T35, T36, T37
**TDD**: Write tests before implementation
**Description**: Keep the active match card and controls visible while score entry is open:
- Opening score entry marks the card as pinned/active.
- Pinned cards stay in the foreground with a stable z-index.
- Pinned controls remain visible even when the mouse is not hovering the card.
- Closing or confirming score entry unpins the card.
- No extra fading/opacity is applied to the active card while editing.

Tests: controls visible without hover while modal open, card has foreground z-index class, card unpins on close, card unpins after confirm, other match cards are unaffected.

---

### T47 - Same-Bracket Connector Lines Only
**Files**: `components/bracket/ConnectorLines.tsx`, `components/bracket/BracketView.tsx`, `__tests__/components/BracketView.test.tsx`
**Depends on**: T29, T30
**TDD**: Write tests before implementation
**Description**: Improve bracket readability by removing connector lines between winner bracket and loser bracket:
- Draw winner-to-winner routes.
- Draw loser-to-loser routes.
- Do not draw winner-to-loser routes.
- Keep in-progress highlighting for same-bracket routes.

Tests: WB-to-WB route renders, LB-to-LB route renders, WB-to-LB route is ignored, highlighted live routes still work inside a bracket.

---

### T48 - Delete Any Tournament with Safe Confirmation (TDD First)
**Files**: `app/api/tournaments/[id]/route.ts`, `components/admin/AdminDashboard.tsx`, `components/admin/TournamentManageView.tsx`, `__tests__/api/tournaments.test.ts`, `__tests__/components/AdminDashboard.test.tsx`, `__tests__/components/TournamentManageView.test.tsx`
**Depends on**: T15, T38, T39
**TDD**: Write tests before implementation
**Description**: Let admins delete tournaments in any status:
- Draft tournaments keep the existing two-click inline confirmation.
- Active and completed tournaments require an explicit typed confirmation using the tournament name.
- API rejects active/completed deletes unless the confirmation name matches exactly.
- Successful deletion redirects admins back to `/admin/dashboard` when deleting from a manage page.
- Toast success/error feedback is shown.

Tests: delete draft, reject active without confirmation, reject active with wrong name, delete active with correct name, delete completed with correct name, dashboard UI confirmation, manage-page delete redirect, auth guard.

---

### T49 - Completed Match Rollback Logic (TDD First)
**Files**: `lib/bracket/rollback.ts`, `__tests__/lib/bracket/rollback.test.ts`
**Depends on**: T24
**TDD**: Write tests before implementation
**Description**: Implement safe rollback for correcting a completed match result:
- Starting from a completed match, find all downstream matches that received the old winner or loser.
- Clear affected downstream slots, scores, winner/loser IDs, court assignments, and statuses.
- Keep unaffected bracket branches intact.
- Remove affected matches from `currentMatchIds`.
- Set tournament status back to `active` if it was `completed`.
- Return the list of affected match IDs for API responses and UI warnings.

Tests: rollback WB match clears winner and loser destinations, rollback LB match clears loser-bracket path, unaffected sibling path stays intact, current courts are cleaned, completed tournament reopens to active, bye matches are not made playable by rollback.

---

### T50 - Match Result Override API (TDD First)
**Files**: `app/api/tournaments/[id]/matches/[matchId]/override/route.ts`, `__tests__/api/override.test.ts`
**Depends on**: T49, T33, T34
**TDD**: Write tests before implementation
**Description**: Add an admin-only endpoint for correcting completed match results:
- `POST /api/tournaments/[id]/matches/[matchId]/override`
- Request: `{ sets: SetScore[], reason?: string }`
- Validates scores using existing scoring rules.
- Determines the corrected winner.
- If the corrected winner changes, uses rollback logic, reapplies corrected scores, and advances the corrected winner/loser.
- If the winner does not change, updates only the score display.
- Returns `{ matchId, winnerChanged, affectedMatchIds, tournamentStatus }`.

Tests: auth guard, invalid scores rejected, completed-only guard, update scores with same winner, change winner and clear downstream path, reopen completed tournament, response includes affected match IDs.

---

### T51 - Completed Match Override UI
**Files**: `components/admin/CompletedMatchControls.tsx`, `components/admin/ScoreEntry.tsx`, `components/admin/MatchControls.tsx`, `components/admin/TournamentManageView.tsx`, `__tests__/components/CompletedMatchControls.test.tsx`, `__tests__/components/ScoreEntry.test.tsx`
**Depends on**: T50
**TDD**: Write tests before implementation
**Description**: Expose correction workflow to admins:
- Completed non-bye matches show an "Override result" action.
- The override form reuses score-entry validation.
- UI warns that downstream matches may be reset.
- Admin must confirm before submitting if the winner changes.
- Toasts show success/error and the bracket refreshes after override.

Tests: completed match shows override action, bye match hides override action, invalid override score stays inline, winner-change warning appears, successful override calls endpoint and refreshes, modal closes on success.

---

### T52 - Tournament Stats Calculation (TDD First)
**Files**: `lib/stats.ts`, `__tests__/lib/stats.test.ts`
**Depends on**: T13, T24, T41
**TDD**: Write tests before implementation
**Description**: Calculate team and player statistics from tournament data:
- Per team: matchesPlayed, matchesWon, matchesLost, setsWon, setsLost, pointsFor, pointsAgainst, pointDiff, winRate.
- Per player: same stats inherited from the player's team in each match.
- Exclude bye matches from point and match totals.
- Include only completed non-bye matches.
- Support aggregation across many tournaments by normalized team/player name.

Tests: BO1 stats, BO3 stats, points for/against, win rate, player stats inherited from team, byes excluded, multiple tournaments aggregate by normalized names.

---

### T53 - Public Stats API Endpoints (TDD First)
**Files**: `app/api/tournaments/[id]/stats/route.ts`, `app/api/stats/route.ts`, `__tests__/api/stats.test.ts`
**Depends on**: T52
**TDD**: Write tests before implementation
**Description**: Add public stats endpoints:
- `GET /api/tournaments/[id]/stats` returns team and player stats for one tournament.
- `GET /api/stats` returns cross-season team and player stats across all stored tournaments.
- Responses are sorted by matchesWon, winRate, pointDiff, then name.
- Endpoints are public read-only and use no admin auth.
- Invalid tournament IDs return 404 using the existing error envelope.

Tests: per-tournament response shape, global response shape, sorting, public access without auth, invalid ID, empty database returns empty arrays.

---

### T54 - Public Stats UI
**Files**: `components/stats/StatsTable.tsx`, `components/stats/TournamentStats.tsx`, `app/(public)/stats/page.tsx`, `components/ui/Navbar.tsx`, `components/bracket/PublicTournamentView.tsx`, `__tests__/components/StatsTable.test.tsx`, `__tests__/components/PublicTournamentView.test.tsx`, `__tests__/components/Navbar.test.tsx`
**Depends on**: T53
**TDD**: Write tests before implementation
**Description**: Display calculated stats publicly:
- Tournament bracket page includes a "Stats" section for the current tournament.
- New `/stats` page shows cross-season team and player stats.
- Navbar links to global stats.
- Stats tables support empty states and loading skeletons.
- Columns include games/matches played, wins, losses, points for, points against, point difference, and win rate.

Tests: tournament page shows stats section, global stats page renders, team/player tabs or sections render, empty state, sortable display order, navbar link.

---

### T55 - Wider and Stacked Bracket Layout
**Files**: `components/bracket/BracketView.tsx`, `components/bracket/WinnerBracket.tsx`, `components/bracket/LoserBracket.tsx`, `components/bracket/PublicTournamentView.tsx`, `components/admin/TournamentManageView.tsx`, `app/(public)/layout.tsx`, `app/admin/layout.tsx`, `__tests__/components/BracketView.test.tsx`, `__tests__/components/PublicTournamentView.test.tsx`, `__tests__/components/TournamentManageView.test.tsx`
**Depends on**: T30, T37
**TDD**: Write tests before implementation
**Description**: Improve desktop/tablet readability for larger tournaments:
- Public bracket view uses the same wide content behavior as admin manage view.
- At widths below roughly 1400px, loser bracket stacks below winner bracket instead of sitting beside it.
- For tournaments with more than 8 teams, default desktop layout stacks loser bracket below winner bracket unless there is enough horizontal room.
- Horizontal scroll stays available inside each bracket section.

Tests: wide layout class present in public view, admin/public use same bracket container behavior, stacked layout class below 1400px, large tournament applies stacked mode, two-team tournament still hides loser bracket.

---

### T56 - Mobile Round Navigation
**Files**: `components/bracket/BracketView.tsx`, `components/bracket/WinnerBracket.tsx`, `components/bracket/LoserBracket.tsx`, `components/bracket/RoundTabs.tsx`, `__tests__/components/BracketView.test.tsx`, `__tests__/components/BracketSections.test.tsx`
**Depends on**: T55
**TDD**: Write tests before implementation
**Description**: Refine mobile bracket visibility:
- Keep Winner/Loser bracket tabs on mobile.
- Add round tabs inside the active bracket, e.g. "Round 1", "Round 2", "Final".
- On mobile, show only the selected round or a compact selected-round view.
- Hide or simplify connector lines in mobile round mode.
- Preserve Up Next banner and match card controls.

Tests: mobile round tabs render, selecting a round hides other rounds, bracket tab change resets/keeps sane round selection, connector lines hidden in mobile round mode, admin controls still render for visible matches.

---

### T57 - Feedback Regression Suite
**Files**: `__tests__/feedback/issues-regression.test.tsx`, `__tests__/api/feedback-regression.test.ts`
**Depends on**: T43-T56
**TDD**: Write tests throughout implementation; finalize after all feedback tasks
**Description**: Add high-level regression coverage for the exact `implemented-issues.md` scenarios:
- Auto scheduling starts matches without admin clicks.
- Admin can manually override a scheduled court.
- Score entry remains pinned while editing.
- WB-to-LB connector lines are absent.
- Admin can delete active/completed tournaments with confirmation.
- Admin can override a completed match and downstream bracket state resets correctly.
- Public tournament and global stats are visible.
- Public/admin bracket layouts stay readable for 8+ teams and mobile round navigation.

This task is complete when every Phase 8 issue listed above has at least one regression test tied to the user-visible behavior.

---

## Phase 8 Dependency Summary

```
T24, T30 -> T43 -> T44 -> T45
T35, T36, T37 -> T46
T29, T30 -> T47
T15, T38, T39 -> T48
T24 -> T49 -> T50 -> T51
T13, T24, T41 -> T52 -> T53 -> T54
T30, T37 -> T55 -> T56
T43-T56 -> T57
```

---

## Additional Estimated Task Count

| Phase | Tasks | Notes |
|---|---|---|
| 8 - Testing Feedback, Usability, and Stats | 15 | Resolves implemented issues 1-9 from `implemented-issues.md`; includes scheduler, overrides, stats, delete flow, and responsive bracket changes |
---

---

## Archived Tasks moved from task.md

### T58 - Multi-Admin Account Model and API (TDD First)
**Files**: `lib/models/User.ts`, `app/api/admin/users/route.ts`, `__tests__/api/admin-users.test.ts`
**Depends on**: T06, T38, T39
**TDD**: Write tests before implementation
**Description**: Extend admin user management so existing admins can create additional admin accounts:
- Allow more than one admin user while keeping unique email/username constraints.
- Add an admin-only API to list and create admin accounts.
- Generate a random 10-character temporary password for new admin accounts.
- Store only the bcrypt hash of the generated password.
- Mark new admin accounts as requiring a password change on first login.
- Return the temporary password only once in the create response.

Tests: auth guard, non-admin rejection, create admin with generated 10-character password, duplicate email rejected, password hash stored instead of plaintext, created user has `mustChangePassword: true`, list admins hides password hashes.

---

### T59 - Forced First-Login Password Change (TDD First)
**Files**: `lib/auth.ts`, `app/admin/change-password/page.tsx`, `app/api/admin/change-password/route.ts`, `middleware.ts`, `__tests__/api/change-password.test.ts`, `__tests__/components/ChangePasswordPage.test.tsx`, `__tests__/middleware.test.ts`
**Depends on**: T58
**TDD**: Write tests before implementation
**Description**: Require newly created admins to set their own password before using the admin area:
- Include `mustChangePassword` in the auth session/JWT.
- Redirect admins with `mustChangePassword: true` to `/admin/change-password`.
- Allow access to logout and password-change routes while locked.
- Validate current temporary password and new password confirmation.
- Hash and save the new password, then clear the first-login flag.
- Redirect back to the admin dashboard after success.

Tests: login with temporary password redirects to change-password page, protected admin routes are blocked while password change is required, wrong current password rejected, mismatched confirmation rejected, successful password change clears flag, old temporary password no longer works.

---

### T60 - Admin Account Management UI
**Files**: `components/admin/AdminUsersPanel.tsx`, `app/admin/dashboard/page.tsx`, `__tests__/components/AdminDashboard.test.tsx`, `__tests__/components/AdminUsersPanel.test.tsx`
**Depends on**: T58, T59
**TDD**: Write tests alongside implementation
**Description**: Add admin account management to the dashboard:
- Show registered admins with email/username, role, and created date.
- Provide a form to create a new admin account.
- Display the generated temporary password once after creation.
- Show clear empty, loading, success, and error states.
- Keep password values out of persistent UI after dismissal or refresh.

Tests: dashboard renders admin users panel, create form validates email, successful create shows temporary password once, duplicate error shown inline, generated password disappears after dismiss, non-admin users cannot access panel.

---

### T61 - Player Account Model and Authentication (TDD First)
**Files**: `lib/models/User.ts`, `lib/models/PlayerProfile.ts`, `lib/auth.ts`, `app/api/auth/signup/route.ts`, `__tests__/lib/models/PlayerProfile.test.ts`, `__tests__/api/signup.test.ts`, `__tests__/lib/auth.test.ts`
**Depends on**: T06, T52
**TDD**: Write tests before implementation
**Description**: Add player accounts for long-term stat tracking and tournament self-service:
- Support player-role users alongside admin users.
- Store player profile data: first name, optional surname, display name, username/email, and user reference.
- Hash player passwords with the same security standard as admins.
- Add public sign-up with duplicate email/username validation.
- Ensure player identity can be linked to teams and historical stats by normalized profile fields.

Tests: player profile validation, unique username/email, password hash stored, signup creates user plus profile, duplicate signup rejected, player login succeeds, player session includes player profile identity, admin-only routes remain admin-only.

---

### T62 - Public Player Registration and Account Pages
**Files**: `app/(public)/signup/page.tsx`, `app/(public)/account/page.tsx`, `components/player/SignupForm.tsx`, `components/player/PlayerAccountView.tsx`, `components/ui/Navbar.tsx`, `__tests__/components/SignupForm.test.tsx`, `__tests__/components/PlayerAccountView.test.tsx`, `__tests__/components/Navbar.test.tsx`
**Depends on**: T61, T54
**TDD**: Write tests alongside implementation
**Description**: Let players create and view their own accounts:
- Public signup form for name, optional surname, username/email, and password.
- Account page shows profile data and the player's tournament/stat summary.
- Navbar shows signup/login/account actions based on session state.
- Player account stats reuse calculated stats instead of manual values.
- Show empty state when a player has not joined or completed tournaments yet.

Tests: signup form validation, successful signup redirects or signs in, account page requires player auth, profile fields render, empty stats state, existing stats render, navbar changes for anonymous/player/admin sessions.

---

### T63 - Joinable Tournament Settings and Join Phase (TDD First)
**Files**: `lib/models/Tournament.ts`, `app/api/tournaments/route.ts`, `app/api/tournaments/[id]/route.ts`, `app/admin/tournament/new/page.tsx`, `app/admin/tournament/[id]/setup/page.tsx`, `__tests__/api/tournaments.test.ts`, `__tests__/components/NewTournamentPage.test.tsx`, `__tests__/components/TournamentSetupPage.test.tsx`
**Depends on**: T18, T61
**TDD**: Write tests before implementation
**Description**: Add admin-controlled self-join settings to tournament creation and setup:
- Add a tournament setting for whether player accounts can join themselves.
- Add a join phase/state before the tournament is started.
- Allow admins to choose between manual player entry, team entry, and account-based self-join where appropriate.
- Prevent joining after the tournament becomes active or completed.
- Keep existing draft/setup flows working for manually entered players and teams.

Tests: create tournament with self-join enabled, create tournament with self-join disabled, invalid self-join/input-mode combinations rejected, setup page shows join settings, active tournaments cannot be joined, existing manual setup tests still pass.

---

### T64 - Player Tournament Self-Join Flow and Highlighting (TDD First)
**Files**: `app/api/tournaments/[id]/join/route.ts`, `components/player/JoinTournamentButton.tsx`, `components/bracket/MatchCard.tsx`, `components/bracket/PublicTournamentView.tsx`, `__tests__/api/join.test.ts`, `__tests__/components/JoinTournamentButton.test.tsx`, `__tests__/components/PublicTournamentView.test.tsx`, `__tests__/components/MatchCard.test.tsx`
**Depends on**: T63
**TDD**: Write tests before implementation
**Description**: Let authenticated players join available tournaments and make their own participation easy to see:
- Public tournament view shows a join action during the join phase.
- Joining links the player account/profile to the tournament roster.
- Prevent duplicate joins and joins after start.
- Admin-entered players and self-joined players can coexist according to tournament settings.
- Highlight the current player's team/matches in the public bracket once teams are generated.

Tests: unauthenticated join rejected or redirects, player can join joinable tournament, duplicate join rejected, active tournament join rejected, joined player appears in setup/roster data, current player's team is highlighted, unrelated teams are not highlighted.

---

### T65 - Switchable Dark Mode
**Files**: `app/layout.tsx`, `components/ui/ThemeProvider.tsx`, `components/ui/ThemeToggle.tsx`, `components/ui/Navbar.tsx`, `components/ui/AdminSidebar.tsx`, `tailwind.config.ts`, `__tests__/components/ThemeToggle.test.tsx`, `__tests__/components/Navbar.test.tsx`, `__tests__/components/AdminSidebar.test.tsx`
**Depends on**: T09, T39
**TDD**: Write tests alongside implementation
**Description**: Add a persistent dark-mode option:
- Support switchable light and dark theme modes.
- Persist the user's theme choice locally.
- Avoid flash of incorrect theme during initial render where practical.
- Expose a compact theme toggle in public and admin navigation.
- Update shared UI components so text, backgrounds, borders, badges, tables, and bracket cards remain readable in dark mode.

Tests: toggle switches light and dark themes, selected theme persists, root class/data attribute updates, public and admin navigation include the toggle, bracket and table components keep readable dark-mode classes, default mode has a stable light fallback.

---

### T66 - Admin Dashboard Metrics API (TDD First)
**Files**: `app/api/admin/dashboard/route.ts`, `lib/admin/dashboardMetrics.ts`, `__tests__/api/admin-dashboard.test.ts`, `__tests__/lib/admin/dashboardMetrics.test.ts`
**Depends on**: T14, T52, T53, T58, T61
**TDD**: Write tests before implementation
**Description**: Provide aggregated dashboard metrics for admins:
- Count registered players, registered admins, and tournaments by status.
- Count total played matches across completed non-bye matches.
- Include recent tournament summaries and top player/team stat snippets where useful.
- Keep the endpoint admin-only.
- Return stable zero values for an empty database.

Tests: auth guard, empty database metrics, counts admins, counts players, counts tournaments by status, counts played matches excluding byes, aggregation across multiple tournaments, response shape remains stable.

---

### T67 - Admin Dashboard Management Panels
**Files**: `components/admin/AdminDashboard.tsx`, `components/admin/DashboardMetrics.tsx`, `components/admin/PlayerUsersPanel.tsx`, `app/admin/dashboard/page.tsx`, `__tests__/components/AdminDashboard.test.tsx`, `__tests__/components/DashboardMetrics.test.tsx`, `__tests__/components/PlayerUsersPanel.test.tsx`
**Depends on**: T60, T66
**TDD**: Write tests alongside implementation
**Description**: Expand the admin dashboard with the roadmap management overview:
- Display registered player count, registered admin count, registered tournament count, and total played matches.
- Show registered players and admins in separate dashboard sections.
- Preserve existing tournament list and actions.
- Add empty/loading/error states for every panel.
- Keep the dashboard scannable on desktop and mobile.

Tests: metrics cards render correct values, players panel renders registered players, admins panel renders registered admins, empty states render, API errors show error state, existing tournament actions still work, responsive layout classes are present.

---

### T68 - Admin Player Registration and Password Reset (TDD First)
**Files**: `app/api/admin/players/route.ts`, `app/api/admin/players/[id]/reset-password/route.ts`, `components/admin/PlayerUsersPanel.tsx`, `__tests__/api/admin-players.test.ts`, `__tests__/components/PlayerUsersPanel.test.tsx`
**Depends on**: T61, T67
**TDD**: Write tests before implementation
**Description**: Let admins create player accounts and reset player passwords:
- Admin can register a player account from the dashboard.
- Admin-created players receive a generated temporary password.
- Admin can reset an existing player's password to a new generated temporary password.
- Reset player accounts are forced to change password on next login.
- Temporary passwords are shown once and never stored plaintext.

Tests: auth guard, admin creates player with generated password, duplicate player rejected, reset password updates hash, reset sets `mustChangePassword: true`, old password fails after reset, temporary password shown once in UI, player can complete forced password change.

---

### T69 - Tournament Format Model and API Support (TDD First)
**Files**: `lib/models/Tournament.ts`, `app/api/tournaments/route.ts`, `app/api/tournaments/[id]/route.ts`, `__tests__/lib/models/Tournament.test.ts`, `__tests__/api/tournaments.test.ts`
**Depends on**: T13, T14, T63
**TDD**: Write tests before implementation
**Description**: Extend tournaments beyond knockout brackets:
- Add a tournament format field, for example `double_elimination`, `team_round_robin`, and `individual_mixer`.
- Preserve existing knockout behavior as the default for old and new tournaments.
- Validate format-specific setup options such as team size, roster source, match format, and whether players or teams are used.
- Ensure API responses expose the format and setup metadata needed by public/admin views.
- Keep existing draft, active, and completed lifecycle semantics.

Tests: default format remains knockout, create team round-robin tournament, create individual mixer tournament, reject incompatible input modes, serialize format metadata, update/get preserves existing tournaments without a format.

---

### T70 - Team Round-Robin Schedule Generation (TDD First)
**Files**: `lib/round-robin/teamSchedule.ts`, `__tests__/lib/round-robin/teamSchedule.test.ts`
**Depends on**: T69, T03
**TDD**: Write tests before implementation
**Description**: Generate "each team vs each team" schedules:
- Build one match for every unique team pair.
- Support odd team counts without creating playable bye matches.
- Assign stable round and position values for display and court scheduling.
- Reuse existing match shape where practical so scoring and court logic can remain shared.
- Keep generated schedules deterministic for the same team order.

Tests: 2 teams creates 1 match, 4 teams creates 6 matches, 5 teams creates 10 matches, no duplicate pairings, no self matches, stable round ordering, odd team count does not create a scored bye.

---

### T71 - Individual Mixer Schedule Generation (TDD First)
**Files**: `lib/round-robin/individualMixer.ts`, `__tests__/lib/round-robin/individualMixer.test.ts`
**Depends on**: T69, T61, T03
**TDD**: Write tests before implementation
**Description**: Generate individual-player tournaments where teams change every match:
- Create per-match temporary teams from registered players.
- Rotate player pairings so players get varied partners and opponents where possible.
- Support configured team sizes using the existing 2/3/4-player team constraints.
- Avoid assigning the same player to both sides of a match.
- Track match participation so standings can credit individual players rather than persistent teams.

Tests: creates valid temporary teams for even player counts, handles remainders according to configured rules, no player appears twice in one match, repeated partners are minimized, every player receives a balanced number of matches where possible, generated matches include player participation metadata.

---

### T72 - Non-Knockout Start and Match Lifecycle Integration (TDD First)
**Files**: `app/api/tournaments/[id]/start/route.ts`, `app/api/tournaments/[id]/matches/[matchId]/status/route.ts`, `app/api/tournaments/[id]/matches/[matchId]/scores/route.ts`, `lib/bracket/advance.ts`, `__tests__/api/start.test.ts`, `__tests__/api/status.test.ts`, `__tests__/api/scores.test.ts`
**Depends on**: T70, T71, T34, T44
**TDD**: Write tests before implementation
**Description**: Start and run round-robin and individual-mixer tournaments:
- Use the selected format to choose knockout, team round-robin, or individual mixer schedule generation.
- Keep court assignment and score entry behavior consistent across formats.
- For non-knockout formats, completing a match should not advance winners/losers through bracket slots.
- Complete the tournament when all scheduled non-bye matches are completed.
- Keep automatic court scheduling available for ready non-knockout matches.

Tests: start team round-robin creates pair schedule, start individual mixer creates temporary-team schedule, completing non-knockout match does not route bracket slots, courts free after completion, auto scheduling fills ready round-robin matches, tournament completes after final scheduled match.

---

### T73 - Non-Knockout Standings and Tie-Breaks (TDD First)
**Files**: `lib/standings/nonKnockout.ts`, `components/bracket/StandingsTable.tsx`, `__tests__/lib/standings/nonKnockout.test.ts`, `__tests__/components/StandingsTable.test.tsx`
**Depends on**: T52, T72
**TDD**: Write tests before implementation
**Description**: Calculate winners for non-knockout formats:
- Rank team round-robin standings by wins first, then point difference or points when wins are tied.
- Rank individual mixer standings by each player's accumulated wins and points across temporary teams.
- Exclude unplayed and bye matches from standings.
- Provide deterministic ordering after all configured tie-breakers.
- Reuse stats fields where possible while keeping tournament-winner standings explicit.

Tests: most wins ranks first, tied wins use points or point difference, exact ties use deterministic name ordering, unplayed matches ignored, team round-robin winner calculated, individual mixer winner calculated from temporary team results.

---

### T74 - Non-Knockout Setup and Public/Admin Views
**Files**: `app/admin/tournament/new/page.tsx`, `app/admin/tournament/[id]/setup/page.tsx`, `components/admin/TournamentManageView.tsx`, `components/bracket/PublicTournamentView.tsx`, `components/bracket/BracketView.tsx`, `components/tournament/RoundRobinView.tsx`, `__tests__/components/NewTournamentPage.test.tsx`, `__tests__/components/TournamentSetupPage.test.tsx`, `__tests__/components/TournamentManageView.test.tsx`, `__tests__/components/PublicTournamentView.test.tsx`
**Depends on**: T72, T73
**TDD**: Write tests alongside implementation
**Description**: Expose round-robin and individual-mixer tournaments in the UI:
- Add tournament format selection during creation/setup.
- Show format-specific setup controls for teams, players, and mixer options.
- Render non-knockout schedules as round lists or match tables instead of bracket graphs.
- Show live standings beside or above the schedule for public and admin views.
- Preserve existing knockout bracket UI for knockout tournaments.

Tests: creation form selects format, setup form changes fields by format, public team round-robin view renders schedule and standings, public individual mixer view highlights player standings, admin controls render for non-knockout matches, knockout tournaments still render the bracket view.

---

## Phase 9 Dependency Summary

```
T06, T38, T39 -> T58 -> T59 -> T60
T06, T52 -> T61 -> T62
T18, T61 -> T63 -> T64
T09, T39 -> T65
T14, T52, T53, T58, T61 -> T66
T60, T66 -> T67
T61, T67 -> T68
T13, T14, T63 -> T69 -> T70
T69, T61 -> T71
T70, T71, T34, T44 -> T72 -> T73 -> T74
```

---

## Additional Roadmap Task Count

| Phase | Tasks | Notes |
|---|---|---|
| 9 - Roadmap Features | 17 | Admin accounts, player accounts/self-join, dark mode, dashboard metrics, player password reset, and non-knockout tournament formats |

---

## Phase 10 - Implemented Issues from implemented-issues.md

Archived from `task.md` after issues 10-19 were implemented. Issue 20 is empty and has no task until a concrete requirement is added.

### Completed Issue Resolution Plan

| Issue | Resolution Tasks | Notes |
|---|---|---|
| 10. Stats table mobile compatibility and account cards too wide | T75 | Make stats and admin account panels responsive. |
| 11. Mobile round tabs are all labeled final | T76 | Fix round label generation for mobile bracket navigation. |
| 12. Burger menu navbar in mobile view | T77 | Add compact mobile navigation for public and authenticated states. |
| 13. Super admin can remove other admins and admin naming should become tournament lead | T78 | Preserve super-admin wording while renaming regular admin-facing labels. |
| 14. Admin logout should redirect to normal login page | T79 | Normalize logout destination. |
| 15. Merge separate login pages and auto-detect account type | T80 | Route users by authenticated role after one shared login. |
| 16. Player accounts need a logout button | T81 | Add player-visible logout affordance. |
| 17. Player joins should be instantly visible in create tournament view | T82 | Refresh join roster live for tournament leads. |
| 18. Admin needs stats reset controls | T83, T84 | Add reset logic first, then dashboard UI. |
| 19. Admin dashboard needs a clickable public-view link | T85 | Add direct public view actions for tournaments. |

### T75 - Responsive Stats Tables and Account Cards (TDD First)
**Files**: `components/stats/StatsTable.tsx`, `components/stats/TournamentStats.tsx`, `components/admin/AdminUsersPanel.tsx`, `components/admin/PlayerUsersPanel.tsx`, `components/admin/AdminDashboard.tsx`, `__tests__/components/StatsTable.test.tsx`, `__tests__/components/AdminUsersPanel.test.tsx`, `__tests__/components/PlayerUsersPanel.test.tsx`
**Depends on**: T54, T60, T67
**TDD**: Write tests before implementation
**Description**: Fix mobile layout problems for stats tables and account-management cards:
- Stats tables fit small screens without horizontal page overflow.
- On mobile, dense stats columns collapse into a compact card/list view or a controlled horizontal scroll area.
- Headers and numeric values remain readable and associated with their labels.
- Admin create-account cards use responsive max widths and do not exceed the viewport.
- Existing desktop table layout remains dense and scannable.

Tests: mobile stats render without viewport overflow, compact labels are visible, desktop table columns still render, create admin/player cards use responsive width classes, long player/team names wrap without clipping.

---

### T76 - Correct Mobile Round Tab Labels (TDD First)
**Files**: `components/bracket/BracketView.tsx`, `components/bracket/WinnerBracket.tsx`, `components/bracket/LoserBracket.tsx`, `lib/bracket/labels.ts`, `__tests__/components/BracketView.test.tsx`, `__tests__/lib/bracket/labels.test.ts`
**Depends on**: T56
**TDD**: Write tests before implementation
**Description**: Fix mobile round navigation labels so every round is named correctly:
- Winner and loser mobile round tabs use stable round numbers: "Round 1", "Round 2", etc.
- Final labels are used only for actual winner-bracket and loser-bracket finals.
- Third-place/lower-bracket final labels stay distinct where applicable.
- Label generation works for 3, 4, 8, and 16 team brackets.

Tests: mobile winner tabs are not all "Final", loser tabs show increasing round numbers, real finals still use final labels, non-power-of-two tournaments produce correct tab labels.

---

### T77 - Mobile Hamburger Navbar
**Files**: `components/ui/Navbar.tsx`, `components/ui/AdminSidebar.tsx`, `app/(public)/layout.tsx`, `app/admin/layout.tsx`, `__tests__/components/Navbar.test.tsx`, `__tests__/components/AdminSidebar.test.tsx`
**Depends on**: T09, T54, T62
**TDD**: Write tests alongside implementation
**Description**: Add responsive mobile navigation:
- Public navbar collapses links behind a hamburger button below the configured mobile breakpoint.
- Auth-aware links for anonymous users, players, tournament leads, and super admins appear in the menu.
- Admin dashboard/sidebar navigation has a mobile drawer or collapsible menu.
- The menu supports keyboard operation, focus handling, and click-outside/escape close behavior.
- Desktop navigation remains unchanged.

Tests: hamburger appears on mobile, desktop links remain visible on desktop, menu opens/closes, expected role-specific links render, escape closes the menu, focusable controls have accessible labels.

---

### T78 - Super Admin Role Controls and Tournament Lead Naming (TDD First)
**Files**: `lib/models/User.ts`, `lib/auth.ts`, `scripts/seed-admin.ts`, `app/api/admin/users/route.ts`, `app/api/admin/users/[id]/route.ts`, `components/admin/AdminUsersPanel.tsx`, `components/ui/Navbar.tsx`, `components/ui/AdminSidebar.tsx`, `__tests__/api/admin-users.test.ts`, `__tests__/components/AdminUsersPanel.test.tsx`, `__tests__/lib/auth.test.ts`
**Depends on**: T58, T59, T60
**TDD**: Write tests before implementation
**Description**: Distinguish the seeded super admin from regular tournament-management accounts:
- Seed/runtime-created owner account is treated as the super admin and displayed as "Admin".
- Regular admin-management accounts are displayed as "Tournament Lead".
- Super admin can remove or deactivate other tournament leads.
- Super admin cannot remove the last super-admin account or remove their own active session accidentally.
- Tournament leads cannot remove other leads or super admins.
- Existing protected tournament-management routes continue to allow tournament leads where appropriate.

Tests: seed creates/keeps a super-admin role, UI labels regular admins as Tournament Lead, super admin removes a tournament lead, removing self is rejected, tournament lead removal attempt is rejected, route authorization still allows tournament leads to manage tournaments.

---

### T79 - Logout Redirect Normalization
**Files**: `components/ui/AdminSidebar.tsx`, `components/ui/Navbar.tsx`, `lib/auth.ts`, `app/admin/login/page.tsx`, `app/(public)/login/page.tsx`, `__tests__/components/AdminSidebar.test.tsx`, `__tests__/components/Navbar.test.tsx`, `__tests__/lib/auth.test.ts`
**Depends on**: T10, T80
**TDD**: Write tests alongside implementation
**Description**: Ensure logout from admin/tournament-lead sessions redirects to the shared normal login page:
- All logout actions call `signOut` with the shared login callback URL.
- Admin-specific login redirects are removed or forwarded to the unified login page.
- Expired sessions and manual logout produce the same login destination.
- Callback URLs still work for protected pages after a fresh login.

Tests: admin logout redirects to shared login, tournament lead logout redirects to shared login, stale admin login URL redirects to shared login, callbackUrl is preserved for protected routes.

---

### T80 - Unified Login Page and Role-Based Redirects (TDD First)
**Files**: `app/(public)/login/page.tsx`, `app/admin/login/page.tsx`, `lib/auth.ts`, `middleware.ts`, `components/ui/Navbar.tsx`, `__tests__/components/LoginPage.test.tsx`, `__tests__/middleware.test.ts`, `__tests__/lib/auth.test.ts`
**Depends on**: T59, T61, T78
**TDD**: Write tests before implementation
**Description**: Replace separate login experiences with one shared login flow:
- A single login page accepts all account types.
- After authentication, role detection redirects super admins and tournament leads to `/admin/dashboard`.
- Player accounts redirect to their account page or the original callback URL when allowed.
- Users without permission for a callback URL are redirected to the correct default for their role.
- Old `/admin/login` links remain as compatibility redirects to the shared login page.

Tests: super admin login redirects to dashboard, tournament lead login redirects to dashboard, player login redirects to account page, unauthorized player callback to admin page is ignored, old admin login URL forwards to shared login, invalid credentials show one consistent error.

---

### T81 - Player Logout UI
**Files**: `components/ui/Navbar.tsx`, `components/player/PlayerAccountView.tsx`, `app/(public)/account/page.tsx`, `__tests__/components/Navbar.test.tsx`, `__tests__/components/PlayerAccountView.test.tsx`
**Depends on**: T62, T80
**TDD**: Write tests alongside implementation
**Description**: Add a clear logout option for player accounts:
- Player navbar/account page includes a logout button when a player session is active.
- Logout redirects to the shared login page or public tournament list according to the shared auth convention.
- The logout action is hidden for anonymous users.
- Admin/tournament-lead logout behavior remains covered by T79.

Tests: player sees logout in navbar, player sees logout on account page, anonymous users do not see logout, clicking logout calls signOut with the expected redirect.

---

### T82 - Live Self-Join Roster Updates in Tournament Setup (TDD First)
**Files**: `app/api/tournaments/[id]/join/route.ts`, `app/admin/tournament/[id]/setup/page.tsx`, `components/admin/TournamentSetupView.tsx`, `components/player/JoinTournamentButton.tsx`, `__tests__/api/join.test.ts`, `__tests__/components/TournamentSetupPage.test.tsx`, `__tests__/components/JoinTournamentButton.test.tsx`
**Depends on**: T63, T64
**TDD**: Write tests before implementation
**Description**: Make player self-joins visible immediately to tournament leads in the create/setup view:
- The join API returns the updated roster/join count.
- The public join button updates its joined state immediately after success.
- The tournament setup view refreshes roster data via the existing client data-fetching pattern.
- Tournament leads can see newly joined players without a full page refresh.
- Duplicate joins and joins after start remain rejected.

Tests: join API response includes updated roster, join button changes to joined state immediately, setup page refreshes after a join, duplicate join still rejected, active tournament join still rejected.

---

### T83 - Stats Reset Logic and API (TDD First)
**Files**: `lib/models/StatsReset.ts`, `lib/stats.ts`, `app/api/admin/stats/reset/route.ts`, `app/api/stats/route.ts`, `app/api/tournaments/[id]/stats/route.ts`, `__tests__/api/stats-reset.test.ts`
**Depends on**: T67, T78, T80
**TDD**: Write tests before implementation
**Description**: Add an admin-only stats reset mechanism without deleting tournaments, matches, scores, or bracket history:
- Store reset rules/audit entries separately from tournaments so historical match data remains intact.
- Reset rules are applied when public/global stats and per-tournament stats are calculated.
- Supported reset scopes:
  - `player`: reset one player/user's individual stats by stable `playerProfileId`; team stats remain unchanged.
  - `tournament`: reset all team and player stats produced by one tournament.
  - `season`: reset all stats from tournaments created in a calendar-year season, using `createdAt` until a dedicated season model exists.
  - `all`: reset all calculated stats.
- Reset requests require the super-admin/Admin role; tournament leads cannot reset stats.
- Reset requests require an exact confirmation phrase and validate target IDs/season values.
- Reset operations are idempotent and return a summary of the affected scope.

Tests: super admin can reset one player, reset player leaves team stats intact, reset tournament removes only that tournament from global and tournament stats, reset season removes only tournaments from that year, complete reset returns empty stats, tournament leads are rejected, invalid payloads are rejected, reset does not delete tournaments or match history.

---

### T84 - Dashboard Stats Reset Tab and Controls (TDD First)
**Files**: `components/admin/AdminDashboard.tsx`, `components/admin/StatsResetPanel.tsx`, `app/admin/dashboard/page.tsx`, `app/api/admin/dashboard/route.ts`, `__tests__/components/AdminDashboard.test.tsx`, `__tests__/components/StatsResetPanel.test.tsx`
**Depends on**: T83
**TDD**: Write tests before implementation
**Description**: Add a dedicated stats reset tab to the admin dashboard:
- Dashboard exposes a "Stats reset" tab/section separate from tournament and account management.
- Super admins can choose a reset scope: player, tournament, season, or all.
- Player and tournament scopes use selectable existing players/tournaments; season scope uses available calendar-year seasons derived from tournament creation dates.
- Destructive reset buttons stay disabled until the exact confirmation phrase is entered.
- Submitting calls `/api/admin/stats/reset` with the selected scope and target.
- Successful resets show a confirmation message and refresh dashboard/stat views; failures show an inline error.
- Tournament leads see a disabled/read-only explanation instead of destructive reset controls.

Tests: stats reset tab renders, scope selector changes required target controls, confirmation gates the submit button, player/tournament/season/all submissions send the expected API payloads, success and error states render, tournament leads cannot access destructive controls.

---

### T85 - Public View Links from Admin Dashboard
**Files**: `components/admin/AdminDashboard.tsx`, `app/admin/dashboard/page.tsx`, `components/ui/AdminSidebar.tsx`, `__tests__/components/AdminDashboard.test.tsx`, `__tests__/components/AdminSidebar.test.tsx`
**Depends on**: T31, T38
**TDD**: Write tests alongside implementation
**Description**: Add clear links from admin dashboard back to public views:
- Every tournament row/card has a "Public View" link to `/tournament/[id]`.
- The dashboard has a general public home/tournament-list link.
- Links are regular anchors/Next links so users can open them in a new tab.
- Draft tournaments link to their public page only if that page supports draft display; otherwise show a disabled/explanatory state.

Tests: active tournament row has public view link, completed tournament row has public view link, general public link renders, link hrefs are correct, draft handling matches supported behavior.

---

## Phase 11 - Roadmap Feature 7: Player Practice Matches

Archived from `task.md` after roadmap feature 7 was implemented.

Roadmap feature 7: players can create small practice matches that do not belong to a tournament. Practice matches count toward personal practice stats, but tournament stats and practice stats stay separated in the global stats view and player account view.

### T86 - Practice Match Model and Validation (TDD First)
**Files**: `lib/models/PracticeMatch.ts`, `lib/practiceMatches.ts`, `__tests__/lib/models/PracticeMatch.test.ts`, `__tests__/lib/practiceMatches.test.ts`
**Depends on**: T12, T61
**TDD**: Write tests before implementation
**Description**: Added a separate practice-match domain model for player-created non-tournament matches:
- Store practice matches separately from tournaments so tournament history and bracket stats are not mixed with practice data.
- Link each match to a creator `playerProfileId`; the creator must appear on one side of the match.
- Support two sides with equal side sizes from 1 to 4 players per side.
- Participants can reference registered `playerProfileId` values and include display names for snapshot/history stability.
- Store played date, set scores, winner side, and timestamps.
- Reuse existing scoring validation rules for set validity and match winner calculation.
- Reject invalid player IDs, duplicate participants in one match, uneven side sizes, empty sides, invalid set scores, and matches without a winner.

Tests cover model requirements, creator participation, duplicate rejection, equal side sizes, valid matches, invalid scores, and winner derivation.

---

### T87 - Player Practice Match API (TDD First)
**Files**: `app/api/practice-matches/route.ts`, `app/api/practice-matches/[id]/route.ts`, `lib/practiceMatches.ts`, `__tests__/api/practice-matches.test.ts`
**Depends on**: T80, T86
**TDD**: Write tests before implementation
**Description**: Added authenticated player APIs to manage their own practice matches:
- `GET /api/practice-matches` returns practice matches visible to the signed-in player, sorted by newest first.
- `POST /api/practice-matches` creates a completed practice match for the signed-in player.
- `PUT /api/practice-matches/[id]` updates a practice match created by the signed-in player.
- `DELETE /api/practice-matches/[id]` removes a practice match created by the signed-in player.
- Players can only mutate practice matches they created.
- Non-player sessions and anonymous requests are rejected.
- API responses serialize stable player display names and omit internal Mongoose fields.

Tests cover authorization, create/list, invalid payloads, owner-only mutation, winner recalculation, and deletion.

---

### T88 - Separate Practice Stats Aggregation (TDD First)
**Files**: `lib/practiceStats.ts`, `lib/stats.ts`, `app/api/stats/route.ts`, `__tests__/lib/practiceStats.test.ts`, `__tests__/api/stats.test.ts`
**Depends on**: T83, T86, T87
**TDD**: Write tests before implementation
**Description**: Added practice-match stats separately from tournament stats:
- Aggregate practice stats by stable `playerProfileId` where possible, using stored display-name snapshots for rendering.
- Count matches played, matches won/lost, sets won/lost, points for/against, point diff, and win rate.
- Do not merge practice matches into tournament team stats or tournament player stats.
- Existing `/api/stats` keeps tournament stats and adds a separate `practicePlayers` collection.
- Apply existing `player` and `all` stats reset rules to practice stats; tournament and season resets only affect tournament-derived stats.

Tests cover practice aggregation, guest exclusion, tournament/practice separation, `/api/stats` practice rows, player reset, and all reset.

---

### T89 - Player Account Practice Match UI (TDD First)
**Files**: `app/(public)/account/page.tsx`, `components/player/PlayerAccountView.tsx`, `components/player/PracticeMatchForm.tsx`, `components/player/PracticeMatchList.tsx`, `__tests__/components/PlayerAccountView.test.tsx`, `__tests__/components/PracticeMatchForm.test.tsx`, `__tests__/components/PracticeMatchList.test.tsx`
**Depends on**: T62, T87, T88
**TDD**: Write tests before implementation
**Description**: Added player account practice-match creation and review:
- Show tournament stats and practice stats as separate account sections.
- Add a practice-match form that defaults the signed-in player into one side.
- Validate set scores client-side before submitting.
- Show a list of the player's practice matches with participants and score.
- Allow the creator to edit or delete a practice match.
- Show empty and error states with responsive/dark-mode-compatible styling.

Tests cover separate account stat summaries, current-player defaults, invalid score blocking, API submit, result rendering, edit, and delete.

---

### T90 - Global Stats Practice Tables (TDD First)
**Files**: `app/(public)/stats/page.tsx`, `components/stats/StatsTable.tsx`, `__tests__/components/PublicPages.test.tsx`
**Depends on**: T75, T88
**TDD**: Write tests before implementation
**Description**: Updated the global stats page so tournament and practice stats are visibly separate:
- Keep existing team stats and tournament player stats tables.
- Add a separate practice player stats table using the practice aggregation output.
- Label tables clearly so users can distinguish tournament player stats from practice match stats.
- Preserve empty states for each stats category independently.
- Do not show practice data inside per-tournament stats pages.

Tests cover independent empty states and practice-player rendering separate from tournament stats.

---

### T91 - Practice Match Polish, Localization, and API Docs (TDD First)
**Files**: `lib/i18n.ts`, `lib/openapi.ts`, `__tests__/components/Localization.test.tsx`, `__tests__/api/openapi.test.ts`, `__tests__/components/ApiDocsPage.test.tsx`
**Depends on**: T87, T89, T90
**TDD**: Write tests before implementation
**Description**: Finished cross-cutting pieces for the practice-match feature:
- Add German and English translations for practice-match labels, empty states, and form controls.
- Document the new practice-match endpoints and schemas in the OpenAPI document.
- Keep Swagger UI pointed at the updated `/api/openapi` document.
- Keep wording tests tied to translation keys where applicable.

Tests cover German account UI practice labels and OpenAPI practice-match routes/schemas.

---

## Phase 12 - Open Issues 21-23

Archived from `task.md` after issues 21, 22, and 23 were implemented.

### T95 - Fixed Round-Robin Match Table Columns and Active-Round Highlight (TDD First)
**Files**: `components/tournament/RoundRobinView.tsx`, `components/admin/TournamentManageView.tsx`, `components/bracket/PublicTournamentView.tsx`, `__tests__/components/PublicTournamentView.test.tsx`, `__tests__/components/TournamentManageView.test.tsx`
**Depends on**: T74
**TDD**: Tests written before implementation
**Description**: Fixed round-robin table layout in admin and public views:
- Round tables now use fixed table layout and stable column width percentages.
- Active/in-progress rows use a light green background instead of width changes.
- Public and admin round-robin views share the same schedule table treatment.
- Small screens keep the table inside the existing horizontal scroll container.

Tests cover fixed table classes, active-round metadata, active-row highlight, and public/admin parity.

---

### T96 - Align Login Card Spacing with Signup Card (TDD First)
**Files**: `app/(public)/login/page.tsx`, `components/player/SignupForm.tsx`, `__tests__/components/LoginPage.test.tsx`, `__tests__/components/SignupForm.test.tsx`
**Depends on**: T80
**TDD**: Tests written before implementation
**Description**: Normalized public auth page spacing:
- Login now uses the same public auth card rhythm as signup.
- Removed the full-screen centered login wrapper.
- Locale and theme controls remain accessible without overlapping the card.

Tests cover login layout classes, signup card layout metadata, and accessible controls.

---

### T97 - Hide Court Override for One-Court Tournaments (TDD First)
**Files**: `components/admin/MatchControls.tsx`, `components/admin/CourtOverrideControls.tsx`, `__tests__/components/MatchControls.test.tsx`, `__tests__/components/CourtOverrideControls.test.tsx`
**Depends on**: T34
**TDD**: Tests written before implementation
**Description**: Simplified match controls when only one court exists:
- Ready one-court matches show only "Mark as in progress".
- One-court in-progress matches hide the manual court selector.
- Multi-court tournaments keep the manual court override control.

Tests cover one-court hidden states, status endpoint usage, and preserved multi-court override behavior.

---

## Phase 12 - Issue 20

Archived from `task.md` after issue 20 was implemented.

### T92 - Team Round-Robin Player Entry and Match Format API (TDD First)
**Files**: `lib/models/Tournament.ts`, `app/api/tournaments/route.ts`, `app/api/tournaments/[id]/route.ts`, `lib/openapi.ts`, `__tests__/lib/models/Tournament.test.ts`, `__tests__/api/tournaments.test.ts`, `__tests__/api/openapi.test.ts`
**Depends on**: T69, T70, T72
**TDD**: Tests written before implementation
**Description**: Extended team round-robin tournament configuration so the format can be driven by player rosters as well as pre-entered teams:
- `team_round_robin` tournaments can use `inputMode: "players"`.
- Player account self-join is allowed for team round-robin player-entry tournaments.
- Round-robin match format is persisted as `roundRobinMatchFormat`, defaults to `bo1`, and accepts `bo3`.
- Incompatible server-side combinations are rejected so knockout and individual-mixer behavior stays unchanged.
- Tournament API responses and OpenAPI now serialize/document the new metadata.

Tests cover player-entry creation, self-join creation, BO1 defaulting, BO3 acceptance, invalid match-format rejection, existing creation behavior, and OpenAPI documentation.

---

### T93 - Exact Team Generation for Team Round-Robin Players (TDD First)
**Files**: `lib/bracket/playerAssign.ts`, `lib/round-robin/teamSchedule.ts`, `app/api/tournaments/[id]/start/route.ts`, `__tests__/lib/playerAssign.test.ts`, `__tests__/lib/round-robin/teamSchedule.test.ts`, `__tests__/api/start.test.ts`
**Depends on**: T92
**TDD**: Tests written before implementation
**Description**: Added strict player-to-team generation for team round-robin player-entry tournaments:
- Team round-robin player entry requires `playerCount % teamSize === 0`.
- Tournament start is rejected until enough players exist and exact divisibility is satisfied.
- Manual player names and self-joined player accounts are combined into one deterministic deduplicated roster.
- Equal-sized teams are generated randomly before the round-robin schedule is created.
- Existing flexible remainder behavior for knockout player assignment is preserved.
- Generated round-robin matches use the persisted `bo1` or `bo3` match format.

Tests cover exact 8-player generation, 9-player rejection, self-joined player inclusion, duplicate-name deduplication, BO3 match generation, and preserved knockout assignment coverage.

---

### T94 - Team Round-Robin Player Setup UI (TDD First)
**Files**: `app/admin/tournament/new/page.tsx`, `components/admin/TournamentSetupForm.tsx`, `components/player/JoinTournamentButton.tsx`, `lib/i18n.ts`, `__tests__/components/NewTournamentPage.test.tsx`, `__tests__/components/TournamentSetupPage.test.tsx`, `__tests__/components/JoinTournamentButton.test.tsx`, `__tests__/components/Localization.test.tsx`
**Depends on**: T92, T93
**TDD**: Tests written before implementation
**Description**: Exposed team round-robin player entry in the admin UI:
- The new tournament form lets tournament leads choose team round-robin with player-name entry.
- Self-join can be enabled for team round-robin player-entry tournaments.
- Round-robin match format defaults to one set per match and can be changed to BO3.
- The setup page shows player entry, self-joined roster data, exact-count validation, and generated team previews.
- Starting is blocked with an inline message until the exact divisibility rule and at least two generated teams are satisfied.
- Regeneration keeps team previews equal-sized.
- German and English labels were added for the new controls and validation messages.

Tests cover player-entry selection, self-join availability, BO1 and BO3 submission, invalid player-count blocking, equal preview generation, self-joined player display, and localized labels.

---

## Phase 13 - Issue 24

Archived from `task.md` after issue 24 was implemented.

### T98 - Registered Player Lookup API (TDD First)
**Files**: `app/api/player-profiles/route.ts`, `lib/playerProfiles.ts`, `lib/openapi.ts`, `__tests__/api/player-profiles.test.ts`, `__tests__/api/openapi.test.ts`
**Depends on**: T80, T91
**TDD**: Tests written before implementation
**Description**: Added a protected registered-player lookup API:
- Searches player profiles by display name, first name, or surname.
- Returns profile IDs and display labels only.
- Omits email, userId, passwordHash, and other account-private fields from response bodies.
- Applies deterministic sorting and bounded result limits.
- Allows admins, tournament leads, and player accounts to use the lookup in setup/practice flows.
- Documents the endpoint and response schema in OpenAPI.

Tests cover authentication, query filtering, result limiting/sorting, no email leakage, and OpenAPI route/schema coverage.

---

### T99 - Practice Match Registered Player Validation (TDD First)
**Files**: `lib/practiceMatches.ts`, `app/api/practice-matches/route.ts`, `app/api/practice-matches/[id]/route.ts`, `__tests__/api/practice-matches.test.ts`
**Depends on**: T87, T98
**TDD**: Tests written before implementation
**Description**: Restricted practice-match participants to registered player profiles:
- Practice-match create/update rejects participants without `playerProfileId`.
- Server resolves participant display names from `PlayerProfile` records instead of trusting client text.
- Creator participation, duplicate prevention, equal-side-size validation, and score validation remain enforced.
- Serialized practice-match responses omit email addresses.

Tests cover missing profile IDs, unknown/spoofed profile participants, canonical display-name snapshots, creator participation, response privacy, and preserved scoring validation.

---

### T100 - Practice Match Player Picker UI (TDD First)
**Files**: `components/player/PracticeMatchForm.tsx`, `components/player/RegisteredPlayerPicker.tsx`, `lib/i18n.ts`, `__tests__/components/PracticeMatchForm.test.tsx`
**Depends on**: T98, T99
**TDD**: Tests written before implementation
**Description**: Replaced free-text practice-match opponent entry with registered-player selection:
- Added a reusable registered-player picker backed by `/api/player-profiles`.
- Defaults the signed-in player into side A.
- Requires selected registered opponents and submits `playerProfileId` values for all participants.
- Prevents duplicate/current-player selection.
- Adds localized loading, empty, and duplicate states.

Tests cover player search calls, selecting an opponent, duplicate prevention, payload shape, and invalid-score blocking.

---

### T101 - Tournament Registered Participant Data Model and API (TDD First)
**Files**: `lib/models/Tournament.ts`, `app/api/tournaments/[id]/route.ts`, `app/api/tournaments/[id]/start/route.ts`, `lib/bracket/playerAssign.ts`, `lib/round-robin/individualMixer.ts`, `__tests__/helpers/factories.ts`, `__tests__/api/tournaments.test.ts`, `__tests__/api/start.test.ts`
**Depends on**: T93, T98
**TDD**: Tests written before implementation
**Description**: Preserved registered-player identity for tournament rosters:
- Added optional aligned `playerProfileIds` on tournament teams while preserving existing player-name rendering.
- Draft roster updates can include registered player profile IDs.
- Server resolves registered tournament participant display names from `PlayerProfile`.
- Team round-robin and individual-mixer generation carry profile IDs into generated teams.
- Duplicate registered players in draft roster updates are rejected.
- Tournament responses continue omitting joined-player emails.

Tests cover manager-entered registered players, canonical display names, duplicate profile rejection, self-joined/generated profile ID preservation, and response privacy.

---

### T102 - Tournament Setup Registered Player Picker UI (TDD First)
**Files**: `components/admin/TournamentSetupForm.tsx`, `components/player/RegisteredPlayerPicker.tsx`, `lib/i18n.ts`, `__tests__/components/TournamentSetupPage.test.tsx`
**Depends on**: T98, T101
**TDD**: Tests written before implementation
**Description**: Let tournament leads add registered players during tournament setup:
- Added registered-player typeahead selection for player-entry tournament setup.
- Tracks selected registered players as roster entries with display names and profile IDs.
- Merges self-joined players into the setup roster without duplicate selected profiles.
- Submits aligned `playerProfileIds` with generated team payloads.
- Keeps manual player-name entry for formats that still support non-account participants.
- Adds localized picker labels, empty states, and duplicate-selection messages.

Tests cover search/select behavior, generated-team payloads with profile IDs, self-joined roster merging, manual-name compatibility, and localized labels through the shared localization suite.

---

### T103 - Tournament Stats by Player Profile (TDD First)
**Files**: `lib/stats.ts`, `app/api/stats/route.ts`, `components/stats/StatsTable.tsx`, `__tests__/lib/stats.test.ts`
**Depends on**: T101
**TDD**: Tests written before implementation
**Description**: Aggregated tournament player stats by stable profile identity:
- Uses `playerProfileId` as the primary player stats key when present.
- Falls back to normalized display names for manual/non-account participants.
- Merges stats for the same registered player across tournaments and entry paths.
- Applies player reset rules by profile ID when available, with legacy name-key fallback.
- Keeps team stats behavior unchanged and practice stats separate.

Tests cover registered-player aggregation across tournaments, display-name changes, profile-based reset filtering, manual fallback rows, and practice/tournament separation through existing stats coverage.

---

## Phase 13 - Issue 25

Archived from `task.md` after issue 25 was implemented.

### T104 - Draft Tournament Roster Lifecycle API (TDD First)
**Files**: `app/api/tournaments/route.ts`, `app/api/tournaments/[id]/route.ts`, `app/api/tournaments/[id]/join/route.ts`, `app/api/tournaments/[id]/start/route.ts`, `lib/models/Tournament.ts`, `__tests__/api/tournaments.test.ts`, `__tests__/api/join.test.ts`, `__tests__/api/start.test.ts`
**Depends on**: T101
**TDD**: Tests written before implementation
**Description**: Made the draft create/save/start lifecycle explicit:
- Tournament creation returns and stores an empty draft without requiring teams, players, or matches.
- Draft roster updates can persist empty rosters without starting the tournament.
- Existing start, join, and update guards keep roster mutation and self-join locked after start.
- Existing start-time validation and match generation remain the only path from draft to active.

Tests cover empty draft creation, empty draft roster saves, start-time validation, generated starts, active join blocking, active edit blocking, and repeated-start conflicts.

---

### T105 - Separate Save Draft and Start Tournament Controls (TDD First)
**Files**: `components/admin/TournamentSetupForm.tsx`, `components/admin/AdminDashboard.tsx`, `app/admin/tournament/new/page.tsx`, `lib/i18n.ts`, `__tests__/components/NewTournamentPage.test.tsx`, `__tests__/components/TournamentSetupPage.test.tsx`, `__tests__/components/AdminDashboard.test.tsx`, `__tests__/components/Localization.test.tsx`
**Depends on**: T102, T104
**TDD**: Tests written before implementation
**Description**: Updated setup so tournament leads can fill rosters over time:
- Added a localized "Save roster" action that PUTs draft participants without calling start or redirecting.
- Kept "Start tournament" as the validated action that saves the final roster, starts the tournament, and redirects to manage.
- Draft player-entry saves can persist partial player rosters, while start still requires generated/valid teams except for individual mixer.
- New tournament creation and dashboard draft setup links continue to route managers into setup.

Tests cover saving without start, existing separate start redirect behavior, readiness validation, draft creation routing, and dashboard draft setup links.

---

### T106 - Draft Public Join Phase and Lock UI (TDD First)
**Files**: `components/bracket/PublicTournamentView.tsx`, `components/player/JoinTournamentButton.tsx`, `components/admin/TournamentSetupForm.tsx`, `lib/i18n.ts`, `__tests__/components/PublicTournamentView.test.tsx`, `__tests__/components/JoinTournamentButton.test.tsx`, `__tests__/components/TournamentSetupPage.test.tsx`, `__tests__/components/Localization.test.tsx`
**Depends on**: T104, T105
**TDD**: Tests written before implementation
**Description**: Made public draft tournaments clear before start:
- Public draft tournaments now render a join-phase panel instead of empty brackets, schedules, or stats.
- Self-join controls render only for draft player-entry tournaments with self-join enabled.
- Joined player display stays live and email-free through existing public tournament serialization.
- Active tournaments continue rendering matches/brackets and hide draft join controls.

Tests cover draft join-phase rendering, no bracket/stat rendering before start, self-join success state, active bracket rendering after start, and existing no-email response coverage.

---

## Phase 14 - Roadmap Item 9

Archived from `task.md` after roadmap item 9 and issue 28 were implemented.

### T109-T113 - Knockout Tournament Variants (TDD First)
**Files**: `lib/models/Tournament.ts`, `lib/bracket/generate.ts`, `lib/bracket/advance.ts`, `app/api/tournaments/route.ts`, `app/api/tournaments/[id]/route.ts`, `app/api/tournaments/[id]/start/route.ts`, `app/api/tournaments/[id]/matches/[matchId]/status/route.ts`, `app/api/tournaments/[id]/matches/[matchId]/scores/route.ts`, `app/api/tournaments/[id]/matches/[matchId]/override/route.ts`, `app/admin/tournament/new/page.tsx`, `components/admin/MatchControls.tsx`, `components/admin/CompletedMatchControls.tsx`, `components/admin/TournamentManageView.tsx`, `lib/i18n.ts`, `lib/openapi.ts`
**Depends on**: T104
**TDD**: Tests written before implementation
**Description**: Implemented configurable knockout tournaments:
- Added persisted knockout configuration for bracket type, first-round pairing mode, result mode, and knockout match format.
- Generated single-elimination brackets without loser-bracket matches while preserving existing double-elimination defaults.
- Added manual first-round pairing with trailing byes and BO1-all knockout generation when BO3 finals are disabled.
- Added winner-only match completion and winner-only override support without synthetic score sets.
- Rejected score entry for winner-only tournaments and winner-only completion for point-scored tournaments.
- Added tournament creation controls for single elimination, manual pairing, winner-only results, and the BO3 semi-final/final switch.
- Documented the new API fields in OpenAPI and moved roadmap item 9 plus issue 28 to the implemented backlog files.

Tests cover model/API defaults and validation, OpenAPI schema fields, single-elimination/manual bracket generation, start route persistence, winner-only completion and overrides, score rejection, stats without point totals, and creation/manage UI controls.

Validation: `npm run typecheck`, `npm run test:coverage`, and `npm run build` passed.

---


## Phase 14 - Remaining Roadmap and Issue Backlog

No active tasks remaining in Phase 14. Issues 26 and 27 are implemented and archived.

---

