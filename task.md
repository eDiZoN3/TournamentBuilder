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

### T115 - TournamentGroup Mongoose Model [COMPLETED]
**Files**: `lib/models/TournamentGroup.ts`, `__tests__/lib/models/TournamentGroup.test.ts`

### T116 - Group Auto-Scheduler Pure Function [COMPLETED]
**Files**: `lib/groups/scheduler.ts`, `__tests__/lib/groups/scheduler.test.ts`

### T117 - Group Leaderboard Calculator Pure Function [COMPLETED]
**Files**: `lib/groups/leaderboard.ts`, `__tests__/lib/groups/leaderboard.test.ts`

---

### T118 - Groups CRUD API [COMPLETED]
**Files**: `app/api/groups/route.ts`, `app/api/groups/[id]/route.ts`, `__tests__/api/groups.test.ts`

---

### T119 - Categories Management API [COMPLETED]
**Files**: `app/api/groups/[id]/categories/route.ts`, `app/api/groups/[id]/categories/[catId]/route.ts`, `__tests__/api/groups-categories.test.ts`

---

### T120 - Teams Management API [COMPLETED]
**Files**: `app/api/groups/[id]/teams/route.ts`, `__tests__/api/groups-teams.test.ts`

---

### T121 - Start Group API [COMPLETED]
**Files**: `app/api/groups/[id]/start/route.ts`, `__tests__/api/groups-start.test.ts`

---

### T122 - Score Entry and Auto-Reschedule API [COMPLETED]
**Files**: `app/api/groups/[id]/categories/[catId]/matches/[matchId]/scores/route.ts`, `app/api/groups/[id]/categories/[catId]/matches/[matchId]/status/route.ts`, `__tests__/api/groups-scores.test.ts`

---

### T123 - Override API for Group Matches [COMPLETED]
**Files**: `app/api/groups/[id]/categories/[catId]/matches/[matchId]/override/route.ts`, `__tests__/api/groups-override.test.ts`

---

### T124 - Group Admin Frontend — Setup Pages [COMPLETED]
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

### T125 - Group Admin Frontend — Active Group Management View [COMPLETED]
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

### T126 - Group Leaderboard Frontend [COMPLETED]
**Files**: `components/groups/GroupLeaderboard.tsx`, `__tests__/components/GroupLeaderboard.test.tsx`
**Depends on**: T117, T125
**TDD**: Write tests before implementation
**Description**: Leaderboard table rendered inside `GroupManageView` (and the public view) when group.status is "completed". The leaderboard data is computed client-side from the full group document using `computeLeaderboard`.

Table columns: Rank | Team | one column per category (showing placement, e.g. "1st", "3rd") | Total Score.
Rows sorted by rank ascending. Tied ranks share the same number.

Tests: renders correct rank order, correct placement per category cell, total score column sums correctly, tied teams share rank number, table has one column per category with the category name as header, hidden when group is not completed.

---

### T127 - Public Group View [COMPLETED]
**Files**: `app/(public)/groups/page.tsx`, `app/(public)/groups/[id]/page.tsx`, `components/groups/PublicGroupView.tsx`, `__tests__/components/PublicGroupView.test.tsx`
**Depends on**: T125, T126
**TDD**: Write tests before implementation
**Description**: Read-only public pages for spectators.

- `/groups`: lists all "active" and "completed" groups by name with a link to each. Does not show "draft" groups.
- `/groups/[id]`: fetches group via `GET /api/groups/[id]`. Renders each category as a collapsible section with its bracket using the existing `BracketView` component (no `renderMatchControls` prop — read-only). Shows `GroupLeaderboard` at the top when the group is completed.

Both pages use SWR polling at 5 s intervals while the group is active.

Tests: list skips draft groups, group view renders one bracket section per category, BracketView receives correct matches/teams per category, leaderboard visible when completed, brackets hidden for draft status, polling stops when completed.

---

### T128 - Navigation and i18n Integration [COMPLETED]
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

---

## Phase 16 — Open Issue Fixes (Issues 29–30)

---

### T129 - Fix "Mark as In Progress" in Winner-Only Tournaments (TDD First)
**Files**: `lib/bracket/advance.ts`, `lib/bracket/scheduler.ts`, `components/admin/MatchControls.tsx`, `__tests__/lib/bracket/advance.test.ts`, `__tests__/lib/bracket/scheduler.test.ts`, `__tests__/components/MatchControls.test.tsx`
**Depends on**: —
**TDD**: Write tests before implementation
**Description**: In winner-only tournaments (`matchResultMode === "winner_only"`), the "Mark as in progress" button in `MatchControls` is disabled whenever `currentMatchIds.length >= courtsAvailable`. Because winner-only matches complete instantly (admin taps "Team Won" — no score entry), court capacity is not a meaningful constraint. The admin needs to freely pick which ready match to start.

Three root causes to fix:

1. **`lib/bracket/advance.ts` — `assignCourt`**: skip the `canMarkInProgress` court-capacity guard when `tournament.matchResultMode === "winner_only"`. Multiple winner-only matches may be `in_progress` simultaneously. Assign `courtNumber` using the lowest free court if one is available, otherwise fall back to `1`. All other `assignCourt` logic (status check, `currentMatchIds` push) remains unchanged.

2. **`lib/bracket/scheduler.ts` — `autoAssignReadyMatches`**: return `{ autoStartedMatches: [] }` immediately when `tournament.matchResultMode === "winner_only"`. Auto-scheduling removes the admin's ability to choose which match runs next; in winner-only mode the admin picks manually.

3. **`components/admin/MatchControls.tsx`**: compute `courtsFull = false` when `matchResultMode === "winner_only"` so the "Mark as in progress" button is never disabled for court-capacity reasons.

Tests (write first):
- `assignCourt` on a winner-only tournament where `currentMatchIds.length >= courtsAvailable`: succeeds, sets match status to `"in_progress"`, pushes match id to `currentMatchIds`
- `assignCourt` on a points tournament where courts are full: still throws `"No courts available"` (regression guard)
- `autoAssignReadyMatches` on a winner-only tournament with ready matches: returns `{ autoStartedMatches: [] }` without touching any match
- `autoAssignReadyMatches` on a points tournament: still auto-assigns the next ready match (regression guard)
- MatchControls: "Mark as in progress" button is **enabled** when `matchResultMode="winner_only"` and all courts are occupied (`currentMatchIds.length >= courtsAvailable`)
- MatchControls: "Mark as in progress" button remains **disabled** for `matchResultMode="points"` when courts are full (regression guard)

---

### T130 - Fix JWT Token Refresh After Password Change (TDD First)
**Files**: `lib/auth.ts`, `app/admin/change-password/page.tsx`, `__tests__/lib/auth.test.ts`
**Depends on**: —
**TDD**: Write tests before implementation
**Description**: After changing password via `/admin/change-password`, the NextAuth JWT token still carries `mustChangePassword: true` because the JWT `callback` in `lib/auth.ts` only updates the token when a `user` object is present (i.e., on initial sign-in). The middleware intercepts every subsequent `/admin/*` navigation and redirects back to `/admin/change-password`. This makes the `/admin/dashboard` redirect after the form submit unreachable and causes every "Manage tournament" link in `AdminDashboard` to redirect to the change-password page instead of the management view.

Fix:

1. **`lib/auth.ts`**: add a `trigger === "update"` branch to the JWT callback that accepts `mustChangePassword` from a client-triggered session refresh:
   ```ts
   if (trigger === "update" && typeof session?.mustChangePassword === "boolean") {
     token.mustChangePassword = session.mustChangePassword;
   }
   ```
   NextAuth v4 JWT-strategy re-runs the `jwt` callback with `trigger: "update"` and the passed session payload, overwriting the encrypted cookie without requiring re-login.

2. **`app/admin/change-password/page.tsx`**: after a successful API response, call `update({ mustChangePassword: false })` from `useSession()` (import `useSession` from `"next-auth/react"`) before calling `router.push(...)`. Remove the existing `router.refresh()` call — it does not update the JWT cookie and is no longer needed.

Tests (write first):
- JWT callback with `trigger === "update"` and `session.mustChangePassword === false`: returned token has `mustChangePassword === false`
- JWT callback with `trigger === "update"` and `session` that does **not** include `mustChangePassword`: token is unchanged (no regression)
- JWT callback on sign-in (`user` object present): still sets `mustChangePassword` from the user object (regression guard)
