# Tournament Builder - Task List

Reference documents: `plan.md` (architecture + models), `specify.md` (product spec), `techplan.md` (algorithms + edge cases), and `completed-tasks.md` for implemented tasks and dependency history.

Each task is atomic enough for a single coding session. TDD tasks write tests first, then implementation. Dependencies are listed as task IDs.

---

## Active Tasks

## Phase 14 - Remaining Roadmap and Issue Backlog

No active tasks remaining in Phase 14. Issues 26 and 27 are implemented and archived.

---

## Phase 15 - Tournament Groups (Roadmap Feature 10)

Tournament groups run N parallel single-elimination categories over the same pool of teams. The system auto-schedules matches to prevent a team from playing in two categories simultaneously. See `roadmap.md` feature 10 for the full spec.

Isolation principle: all group logic lives under `lib/groups/`, `lib/models/TournamentGroup.ts`, and `app/api/groups/`. Reuse `lib/bracket/generate.ts`, `lib/bracket/advance.ts`, `lib/bracket/rollback.ts`, and `lib/scoring.ts` as pure logic helpers — do not modify them.

---

### T115 - TournamentGroup Mongoose Model (TDD First)
**Files**: `lib/models/TournamentGroup.ts`, `__tests__/lib/models/TournamentGroup.test.ts`
**Depends on**: —
**TDD**: Write tests before implementation
**Description**: Define the MongoDB schema for tournament groups and their embedded sub-documents.

Schema:
- `GroupTeam` sub-schema: `name` (string, required), `players` (string[]), `seed` (number).
- `GroupMatch` sub-schema: identical field set to the existing `IMatch` (bracket, round, position, label, placeRange, format, teamA, teamB, status, winnerId, loserId, winnerNextMatchId, loserNextMatchId, winnerNextSlot, loserNextSlot, isBye, isWBFinal, isLBFinal, courtNumber). Reuse the same field definitions, do not import from Tournament model.
- `GroupCategory` sub-schema: `name` (string, required), `position` (number, required — controls priority order), `status` ("pending" | "active" | "completed", default "pending"), `matches` (GroupMatch[]).
- `TournamentGroup` root schema: `name` (string, required), `status` ("draft" | "active" | "completed", default "draft"), `teams` (GroupTeam[]), `categories` (GroupCategory[]), `createdAt` (Date, default now).

Export TypeScript interfaces `ITournamentGroup`, `IGroupCategory`, `IGroupMatch`, `IGroupTeam`.

Tests: name is required, status defaults to "draft", category position field stored correctly, embedded match fields round-trip through save/load, createdAt auto-set.

---

### T116 - Group Auto-Scheduler Pure Function (TDD First)
**Files**: `lib/groups/scheduler.ts`, `__tests__/lib/groups/scheduler.test.ts`
**Depends on**: T115
**TDD**: Write tests before implementation
**Description**: Pure function `computeNextMatches(categories: IGroupCategory[]): Array<{ categoryIndex: number; matchId: string }>` that, given the current match state across all categories, returns which `ready` matches should be activated next — one per idle category, subject to the team-conflict constraint.

Algorithm:
1. Build `activeTeamIds`: collect `teamA.teamId` and `teamB.teamId` from every `in_progress` match across all categories.
2. Iterate categories in ascending `position` order. For each category that has no `in_progress` match:
   a. Find the first match with `status === "ready"` and `teamA` and `teamB` both set where neither `teamId` is in `activeTeamIds`.
   b. If found: append `{categoryIndex, matchId}` to the result, then add both `teamId`s to `activeTeamIds` so later categories in the same pass account for this activation.
3. Return the result list (may be empty).

Tests:
- No categories → returns [].
- Single category with one ready match → returns that match.
- Single category, all matches pending → returns [].
- Category already has an in_progress match → skipped (not returned again).
- Two categories, one team active in cat 1 → their ready match in cat 2 skipped; next ready match in cat 2 without that team is returned.
- Three categories, all unblocked → all three returned in position order.
- Activation in an earlier category blocks a match in a later category within the same call → later category skips to its next eligible match.
- All categories blocked by conflicts → returns [].

---

### T117 - Group Leaderboard Calculator Pure Function (TDD First)
**Files**: `lib/groups/leaderboard.ts`, `__tests__/lib/groups/leaderboard.test.ts`
**Depends on**: T115
**TDD**: Write tests before implementation
**Description**: Pure function `computeLeaderboard(categories: IGroupCategory[], teams: IGroupTeam[]): LeaderboardRow[]` where `LeaderboardRow = { teamId: string; teamName: string; placements: number[]; totalScore: number; totalWins: number; rank: number }`.

Placement extraction per category:
- Find the match whose `placeRange` is "1st-2nd Place": its `winnerId` → placement 1, its `loserId` → placement 2.
- Find matches with "3rd-4th Place", "3rd Place", "5th-8th Place", "7th-8th Place", etc.: winner gets the lower bound of the range, loser gets the upper bound.
- Parse range bounds from the stored English `placeRange` string (e.g. "7th-8th Place" → bounds 7 and 8).
- Teams not yet placed in a category (category not completed) receive a fallback placement equal to the total team count.

Ranking:
- Sort by `totalScore` ascending (sum of all placement bounds, lower is better).
- Ties broken by `totalWins` descending (total `winnerId` appearances across all category matches).
- Assign `rank` starting at 1; ties share the same rank.

Tests:
- 4 teams, 1 category, all matches complete → correct 1st/2nd/3rd-4th placements and total scores.
- 4 teams, 2 categories, one team wins both → total score 2, rank 1.
- Tie on total score → tie broken by wins, correct shared rank.
- Incomplete category → fallback placement applied for that category.
- Empty teams list → returns [].

---

### T118 - Groups CRUD API (TDD First)
**Files**: `app/api/groups/route.ts`, `app/api/groups/[id]/route.ts`, `__tests__/api/groups.test.ts`
**Depends on**: T115
**TDD**: Write tests before implementation
**Description**: Core REST endpoints for tournament group lifecycle.

- `POST /api/groups` (admin only): create a group from `{ name: string }`. Returns the created group with status "draft". Rejects with 400 if name missing.
- `GET /api/groups` (admin only): return array of group summaries `{ _id, name, status, teamCount, categoryCount, createdAt }`.
- `GET /api/groups/[id]` (public): return full group document including all embedded categories and their matches. Returns 404 if not found.
- `DELETE /api/groups/[id]` (admin only): delete group. Returns 409 if status is "active".

Tests: create with valid name, create without name → 400, list returns summaries, get by id, get non-existent → 404, delete draft group, delete active group → 409, unauthenticated POST/DELETE → 401.

---

### T119 - Categories Management API (TDD First)
**Files**: `app/api/groups/[id]/categories/route.ts`, `app/api/groups/[id]/categories/[catId]/route.ts`, `__tests__/api/groups-categories.test.ts`
**Depends on**: T118
**TDD**: Write tests before implementation
**Description**: Endpoints for adding, renaming, and removing categories from a draft group.

- `POST /api/groups/[id]/categories` (admin): add `{ name: string }` as a new category. Appended with `position = current max position + 1`. Rejects 400 if name missing, 409 if group is not "draft".
- `DELETE /api/groups/[id]/categories/[catId]` (admin): remove the category. Rejects 409 if group is not "draft".
- `PUT /api/groups/[id]/categories/[catId]` (admin): rename `{ name: string }`. Rejects 409 if group is not "draft".

Tests: add category increments position, delete removes only that category, rename updates name, all three routes return 409 on active group, unauthenticated → 401, category not found → 404.

---

### T120 - Teams Management API (TDD First)
**Files**: `app/api/groups/[id]/teams/route.ts`, `__tests__/api/groups-teams.test.ts`
**Depends on**: T118
**TDD**: Write tests before implementation
**Description**: Endpoint to set the complete team roster of a draft group.

- `PUT /api/groups/[id]/teams` (admin): replace `teams` array with `{ teams: [{ name: string, players: string[] }] }`. Seeds are assigned 1…N by array order. Rejects 409 if group not "draft", 400 if fewer than 2 teams provided.

Tests: teams replaced and seeds assigned, rejects < 2 teams → 400, rejects on active group → 409, unauthenticated → 401.

---

### T121 - Start Group API (TDD First)
**Files**: `app/api/groups/[id]/start/route.ts`, `__tests__/api/groups-start.test.ts`
**Depends on**: T118, T119, T120, T116
**TDD**: Write tests before implementation
**Description**: Endpoint that transitions a group from "draft" to "active", generates brackets for all categories, and runs the initial auto-schedule.

- `POST /api/groups/[id]/start` (admin):
  1. Validates: ≥ 2 teams, ≥ 1 category. Returns 400 otherwise.
  2. Returns 409 if group is not "draft".
  3. For each category (in position order): calls `lib/bracket/generate.ts` with `knockoutBracketType: "single_elimination"` and the group's teams; stores resulting matches on the category; sets category status to "active".
  4. Sets group status to "active".
  5. Calls `computeNextMatches` and sets the returned matches to `in_progress`.
  6. Returns the updated group.

Tests: bracket generated for each category with correct match count, first round ready matches auto-started, if first ready match in cat 1 uses the same teams as in cat 2 then cat 2 first activates the next eligible pair, reject if no teams → 400, reject if no categories → 400, reject if already active → 409, unauthenticated → 401.

---

### T122 - Score Entry and Auto-Reschedule API (TDD First)
**Files**: `app/api/groups/[id]/categories/[catId]/matches/[matchId]/scores/route.ts`, `app/api/groups/[id]/categories/[catId]/matches/[matchId]/status/route.ts`, `__tests__/api/groups-scores.test.ts`
**Depends on**: T121, T116
**TDD**: Write tests before implementation
**Description**: Endpoints to record set scores and confirm a match winner, triggering bracket advancement and auto-rescheduling.

- `PUT .../scores` (admin): accept `{ setIndex, scoreA, scoreB }`, validate via `lib/scoring.ts`, save onto the match, return the updated group. Rejects if match is not `in_progress`.
- `PUT .../status` with `{ status: "completed" }` (admin): confirm the match is done.
  1. Validates a winner is determined (at least one set saved with a clear winner per `lib/scoring.ts`).
  2. Sets match status to "completed".
  3. Calls `lib/bracket/advance.ts` on the category's match list to propagate winner/loser to the next round.
  4. Marks newly-populated next-round matches as "ready" where both slots are filled.
  5. Calls `computeNextMatches` across all categories and sets the returned matches to `in_progress`.
  6. If every match in every category is now "completed", sets each category status to "completed" and group status to "completed".
  7. Returns the updated group.

Tests: set score saved, match confirmed, next-round match promoted to ready, scheduler activates next eligible match, blocked match (team conflict) not started, group completes when last match in last category confirmed, unauthenticated → 401, match not in_progress → 409.

---

### T123 - Override API for Group Matches (TDD First)
**Files**: `app/api/groups/[id]/categories/[catId]/matches/[matchId]/override/route.ts`, `__tests__/api/groups-override.test.ts`
**Depends on**: T122
**TDD**: Write tests before implementation
**Description**: Admin endpoint to correct a completed match result within a group category.

- `POST .../override` (admin): accept `{ sets: ISetScore[] }`.
  1. Calls `lib/bracket/rollback.ts` on the category's match list to reverse downstream advancement from the overridden match.
  2. Applies the corrected sets and re-determines the winner via `lib/scoring.ts`.
  3. Re-advances via `lib/bracket/advance.ts`.
  4. Re-runs `computeNextMatches` and sets newly-eligible matches to `in_progress`.
  5. Returns the updated group.

Tests: winner changed → downstream matches reset and re-advanced, scheduler fires after rollback, corrected winner propagated to next round, unauthenticated → 401.

---

### T124 - Group Admin Frontend — Setup Pages (TDD First)
**Files**: `app/admin/groups/page.tsx`, `app/admin/groups/new/page.tsx`, `components/groups/GroupSetupForm.tsx`, `__tests__/components/GroupSetupForm.test.tsx`
**Depends on**: T118, T119, T120
**TDD**: Write tests before implementation
**Description**: Admin pages for creating and configuring a group before starting it.

- `/admin/groups`: list all groups (name, status, team count, category count) with a "New group" button. Each row links to `/admin/groups/[id]`.
- `/admin/groups/new`: rendered by `GroupSetupForm`. Three sections on one page:
  - Group name input (required).
  - Team entry: add/remove team name rows (same input pattern as existing `TournamentSetupForm` team entry). Minimum 2 teams required before submission.
  - Category entry: add/remove/rename category name rows. Minimum 1 category required. Categories listed in order; order defines priority.
  - "Create group" button: calls `POST /api/groups`, then `PUT /api/groups/[id]/teams`, then `POST /api/groups/[id]/categories` for each category, then redirects to `/admin/groups/[id]`.

Tests: list renders group rows, new group form requires name, add team row, remove team row, add category row, remove category row, submit fires correct API sequence, fewer than 2 teams blocks submission, no categories blocks submission.

---

### T125 - Group Admin Frontend — Active Group Management View (TDD First)
**Files**: `app/admin/groups/[id]/page.tsx`, `components/groups/GroupManageView.tsx`, `components/groups/CategoryLiveRow.tsx`, `__tests__/components/GroupManageView.test.tsx`
**Depends on**: T124, T122
**TDD**: Write tests before implementation
**Description**: Server-loaded page and client component for managing an active group. Polls via SWR every 5 seconds (same pattern as `TournamentManageView`).

Layout — one `CategoryLiveRow` per category (in position order):
- Category name and status badge.
- **Active match**: team A name vs team B name with an "Enter scores" button that opens the existing `ScoreEntry` component for that match. Hidden when category has no `in_progress` match.
- **Next queued match**: label of the first `ready` match in the category whose teams are not currently blocked. Read-only. Hidden when none available.
- **Idle indicator**: "Waiting — teams occupied" when the category has no active match and all ready matches are blocked by conflicts. Hidden otherwise.

When group.status is "completed", replace the live view with the `GroupLeaderboard` component (T126).

A "Start group" button visible only when group.status is "draft"; clicking calls `POST /api/groups/[id]/start`.

Tests: renders one row per category, active match shows team names and score entry button, queued match label shown, idle indicator shown when blocked, score entry opens ScoreEntry for the correct matchId, start button hidden when active, leaderboard shown when completed, SWR polling refreshes view.

---

### T126 - Group Leaderboard Frontend (TDD First)
**Files**: `components/groups/GroupLeaderboard.tsx`, `__tests__/components/GroupLeaderboard.test.tsx`
**Depends on**: T117, T125
**TDD**: Write tests before implementation
**Description**: Leaderboard table rendered inside `GroupManageView` (and the public view) when group.status is "completed". The leaderboard data is computed client-side from the full group document using `computeLeaderboard`.

Table columns: Rank | Team | one column per category (showing placement, e.g. "1st", "3rd") | Total Score.
Rows sorted by rank ascending. Tied ranks share the same number.

Tests: renders correct rank order, correct placement per category cell, total score column sums correctly, tied teams share rank number, table has one column per category with the category name as header, hidden when group is not completed.

---

### T127 - Public Group View (TDD First)
**Files**: `app/(public)/groups/page.tsx`, `app/(public)/groups/[id]/page.tsx`, `components/groups/PublicGroupView.tsx`, `__tests__/components/PublicGroupView.test.tsx`
**Depends on**: T125, T126
**TDD**: Write tests before implementation
**Description**: Read-only public pages for spectators.

- `/groups`: lists all "active" and "completed" groups by name with a link to each. Does not show "draft" groups.
- `/groups/[id]`: fetches group via `GET /api/groups/[id]`. Renders each category as a collapsible section with its bracket using the existing `BracketView` component (no `renderMatchControls` prop — read-only). Shows `GroupLeaderboard` at the top when the group is completed.

Both pages use SWR polling at 5 s intervals while the group is active.

Tests: list skips draft groups, group view renders one bracket section per category, BracketView receives correct matches/teams per category, leaderboard visible when completed, brackets hidden for draft status, polling stops when completed.

---

### T128 - Navigation and i18n Integration (TDD First)
**Files**: `components/ui/Navbar.tsx`, `lib/i18n.ts`, `app/admin/dashboard/page.tsx` (or admin sidebar), `__tests__/components/Navbar.test.tsx`, `__tests__/components/Localization.test.tsx`
**Depends on**: T127
**TDD**: Write tests before implementation
**Description**: Wire tournament groups into navigation and add all translation keys introduced in T124–T127.

Navigation changes:
- Public navbar: add "Groups" link pointing to `/groups`, alongside "Tournaments" and "Stats".
- Admin sidebar/dashboard: add "Groups" section linking to `/admin/groups`.

New translation keys (add to both `en` and `de` in `lib/i18n.ts`):
- `tournamentGroups`: "Tournament Groups" / "Turniergruppen"
- `groups`: "Groups" / "Gruppen"
- `group`: "Group" / "Gruppe"
- `newGroup`: "New group" / "Neue Gruppe"
- `groupName`: "Group name" / "Gruppenname"
- `categories`: "Categories" / "Kategorien"
- `category`: "Category" / "Kategorie"
- `addCategory`: "Add category" / "Kategorie hinzufügen"
- `categoryName`: "Category name" / "Kategoriename"
- `startGroup`: "Start group" / "Gruppe starten"
- `groupLeaderboard`: "Group leaderboard" / "Gruppenrangliste"
- `totalScore`: "Total score" / "Gesamtpunktzahl"
- `idleWaitingForTeams`: "Waiting — teams occupied" / "Wartend — Teams belegt"
- `nextQueuedMatch`: "Next up" / "Nächstes Spiel"
- `noGroupsYet`: "No tournament groups yet." / "Noch keine Turniergruppen."

Tests: "Groups" link present in public navbar in both locales, admin sidebar has groups link, all new translation keys exist in both `en` and `de` and produce non-empty strings.
