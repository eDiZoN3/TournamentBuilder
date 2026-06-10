# Tournament Builder - Task List

Reference documents: `plan.md` (architecture + models), `specify.md` (product spec), `techplan.md` (algorithms + edge cases), and `completed-tasks.md` for implemented tasks and dependency history.

Each task is atomic enough for a single coding session. TDD tasks write tests first, then implementation. Dependencies are listed as task IDs.

---

## Active Tasks

## Phase 16 - Open Issue Fixes (Issues 29-31)

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

---

### T131 - Show Live Standings for Active Tournament Groups (TDD First)
**Files**: `lib/groups/leaderboard.ts`, `components/groups/GroupLeaderboard.tsx`, `components/groups/PublicGroupView.tsx`, `components/groups/GroupManageView.tsx`, `__tests__/lib/groups/leaderboard.test.ts`, `__tests__/components/GroupLeaderboard.test.tsx`, `__tests__/components/PublicGroupView.test.tsx`, `__tests__/components/GroupManageView.test.tsx`
**Depends on**: T117, T126, T127
**TDD**: Write tests before implementation
**Description**: Public tournament-group pages currently show the group leaderboard only after `group.status === "completed"`. Issue 31 asks for live standings during group tournaments so spectators can follow the overall group result while categories are still being played.

Fix:

1. **`lib/groups/leaderboard.ts`**: make `computeLeaderboard(group)` safe for partial group results.
   - Return placement data aligned to the group's categories sorted by `position`, not a compact array of only completed placements. This prevents a result from Category B appearing under the Category A column when earlier categories are still pending.
   - Include all configured `group.teams` in the returned rows once the group has categories, even when some or all category placements are still unknown.
   - Represent unknown category placements as `null` and exclude them from `totalScore`.
   - Derive known elimination placements as soon as a team is eliminated from a category. Do not require the category final to be completed before assigning earlier-round loser placements; only 1st and 2nd place require the final match result.
   - Keep the existing completed-group behavior: lower `totalScore` ranks better, `totalWins` remains the tie-breaker, and deterministic ordering is preserved for exact ties.

2. **`components/groups/GroupLeaderboard.tsx`**: render the table for active and completed groups, not only completed groups.
   - Add a heading or mode-aware label such as "Live standings" for active groups and keep completed groups readable as final standings/leaderboard.
   - Render unknown placements as a clear pending marker (for example `-` or `Pending`) instead of misaligned ordinal values.
   - Keep columns stable: Rank, Team, one column per category, Total Score.
   - Do not render the leaderboard for draft groups.

3. **`components/groups/PublicGroupView.tsx`**: show `GroupLeaderboard` above category brackets whenever `group.status !== "draft"`, so `/groups/[id]` exposes live group standings during the whole active group.

4. **`components/groups/GroupManageView.tsx`**: keep admin visibility consistent by showing the same live leaderboard for active groups without removing the existing category live rows and score-entry workflow. Completed groups may still replace the live rows with the final leaderboard.

Tests (write first):
- `computeLeaderboard` on an active group with no completed matches returns one row per configured team with category-aligned `null` placements and `totalScore === 0`
- `computeLeaderboard` on a group where Category B has a known placement but Category A is still pending keeps the Category B placement in the Category B cell
- `computeLeaderboard` assigns earlier-round loser placements before the category final is completed
- `computeLeaderboard` still ranks a fully completed group by lower total score, then more total wins (regression guard)
- `GroupLeaderboard` renders for `status="active"` and shows unknown placements with the pending marker
- `GroupLeaderboard` renders nothing for `status="draft"` (regression guard)
- `PublicGroupView` shows `GroupLeaderboard` for an active group and still renders category brackets
- `PublicGroupView` still hides brackets and leaderboard for draft groups
- `GroupManageView` shows the live leaderboard for an active group while retaining category live rows and score-entry controls
- `GroupManageView` still shows the completed leaderboard when the group is completed and stops polling when completed (regression guard)
