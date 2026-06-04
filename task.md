# Tournament Builder — Task List

Reference documents: plan.md (architecture + models), specify.md (product spec), techplan.md (algorithms + edge cases), completed-tasks.md for already completed tasks (needed maybe for dependencies).

Each task is atomic enough for a single coding session. TDD tasks write tests first, then implementation. Dependencies listed as task IDs.

---

## Phase 10 - Open Issues from issues.md

This phase tracks the currently not-implemented issues in `issues.md` (items 10-19). Issue 20 is empty and has no task until a concrete requirement is added.

### Open Issue Resolution Plan

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
