# Tournament Builder - Task List

Reference documents: `plan.md` (architecture + models), `specify.md` (product spec), `techplan.md` (algorithms + edge cases), and `completed-tasks.md` for implemented tasks and dependency history.

Each task is atomic enough for a single coding session. TDD tasks write tests first, then implementation. Dependencies are listed as task IDs.

---

## Active Tasks

### Phase 13 - Open Issue 25

Issue 25 focus: tournaments can be created ahead of time as drafts, rosters can be filled gradually by managers or self-joining players, and teams/matches are generated only when the manager starts the tournament.

#### T104 - Draft Tournament Roster Lifecycle API (TDD First)
**Files**: `app/api/tournaments/route.ts`, `app/api/tournaments/[id]/route.ts`, `app/api/tournaments/[id]/join/route.ts`, `app/api/tournaments/[id]/start/route.ts`, `lib/models/Tournament.ts`, `__tests__/api/tournaments.test.ts`, `__tests__/api/join.test.ts`, `__tests__/api/start.test.ts`
**Depends on**: T101
**TDD**: Write tests before implementation
**Description**: Make the create/save/start lifecycle explicit and guarded:
- Creating a tournament stores a draft without requiring participants.
- Draft roster updates can save empty, partial, or complete participant lists without starting the tournament.
- Self-join remains allowed only while the tournament is draft, player-entry, and self-join enabled.
- Starting validates the final roster requirements for the selected format and generates teams/matches at that point only.
- Starting locks the roster and prevents further manager edits or player joins.
- Re-starting an already active/completed tournament returns a conflict.

Tests should cover empty draft creation, partial roster saves, start-time validation failures, successful start generation, join blocking after start, edit blocking after start, and conflict on repeated start.

---

#### T105 - Separate Save Draft and Start Tournament Controls (TDD First)
**Files**: `components/admin/TournamentSetupForm.tsx`, `components/admin/AdminDashboard.tsx`, `app/admin/tournament/new/page.tsx`, `lib/i18n.ts`, `__tests__/components/NewTournamentPage.test.tsx`, `__tests__/components/TournamentSetupPage.test.tsx`, `__tests__/components/AdminDashboard.test.tsx`, `__tests__/components/Localization.test.tsx`
**Depends on**: T102, T104
**TDD**: Write tests before implementation
**Description**: Update the admin flow so tournament setup can happen over time:
- New tournament creation only creates the draft and routes to the setup/draft screen.
- Setup has a "Save roster" action that persists current draft participants without starting.
- Setup has a separate "Start tournament" action that validates and starts when ready.
- Draft tournament cards clearly link back to setup from the dashboard.
- Show inline readiness messages for missing/invalid roster requirements.
- Redirect to manage view only after a successful start.

Tests should cover draft creation without participants, saving without start, separate start action, dashboard draft setup links, readiness messaging, and redirect behavior.

---

#### T106 - Draft Public Join Phase and Lock UI (TDD First)
**Files**: `components/bracket/PublicTournamentView.tsx`, `components/player/JoinTournamentButton.tsx`, `components/admin/TournamentSetupForm.tsx`, `lib/i18n.ts`, `__tests__/components/PublicTournamentView.test.tsx`, `__tests__/components/JoinTournamentButton.test.tsx`, `__tests__/components/TournamentSetupPage.test.tsx`, `__tests__/components/Localization.test.tsx`
**Depends on**: T104, T105
**TDD**: Write tests before implementation
**Description**: Make draft tournaments understandable for players and managers before start:
- Public draft tournaments show a join-phase view instead of an empty bracket.
- Joined players are listed live without exposing emails.
- Signed-in players can join only when allowed and see their joined state immediately.
- After start, public view switches to matches/bracket and hides join controls.
- Admin setup shows the live self-joined roster and locked/started state consistently.

Tests should cover draft join-phase rendering, no email leakage, successful join state updates, join controls hidden after start, public bracket rendering after start, and live setup roster display.
