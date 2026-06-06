# Tournament Builder - Task List

Reference documents: `plan.md` (architecture + models), `specify.md` (product spec), `techplan.md` (algorithms + edge cases), and `completed-tasks.md` for implemented tasks and dependency history.

Each task is atomic enough for a single coding session. TDD tasks write tests first, then implementation. Dependencies are listed as task IDs.

---

## Active Tasks

### Issue Coverage

| Issue | Tasks | Goal |
| --- | --- | --- |
| 20 | T92, T93, T94 | Team round-robin can be created from player names/self-joins, randomly generate equal-sized teams, and choose BO1/BO3 matches. |

---

## Phase 12 - Open Issue 20

### T92 - Team Round-Robin Player Entry and Match Format API (TDD First)
**Files**: `lib/models/Tournament.ts`, `app/api/tournaments/route.ts`, `app/api/tournaments/[id]/route.ts`, `lib/openapi.ts`, `__tests__/lib/models/Tournament.test.ts`, `__tests__/api/tournaments.test.ts`, `__tests__/api/openapi.test.ts`
**Depends on**: T69, T70, T72
**TDD**: Write tests before implementation
**Description**: Extend team round-robin tournament configuration so the format can be driven by player rosters as well as pre-entered teams:
- Allow `team_round_robin` tournaments to use `inputMode: "players"` instead of forcing team entry only.
- Allow player account self-join for team round-robin player-entry tournaments.
- Add a persisted round-robin match format setting with default `bo1` and optional `bo3`.
- Validate incompatible combinations server-side so knockout and individual-mixer behavior stays unchanged.
- Serialize the new metadata in tournament API responses and document it in OpenAPI.

Tests: create team round-robin with player entry, create team round-robin with self-join enabled, default round-robin match format is BO1, BO3 is accepted, invalid match format is rejected, existing knockout and individual mixer creation tests still pass, OpenAPI documents the field.

---

### T93 - Exact Team Generation for Team Round-Robin Players (TDD First)
**Files**: `lib/bracket/playerAssign.ts`, `lib/round-robin/teamSchedule.ts`, `app/api/tournaments/[id]/start/route.ts`, `__tests__/lib/playerAssign.test.ts`, `__tests__/lib/round-robin/teamSchedule.test.ts`, `__tests__/api/start.test.ts`
**Depends on**: T92
**TDD**: Write tests before implementation
**Description**: Generate random teams from player names/self-joined players for team round-robin tournaments, with strict divisibility rules:
- For team round-robin player entry, require `playerCount % teamSize === 0`.
- Reject tournament start until enough players exist and the exact divisibility rule is satisfied.
- Combine manually entered player names and self-joined player accounts into the roster without duplicates.
- Generate equal-sized teams randomly from the roster before creating the round-robin schedule.
- Preserve existing flexible remainder behavior for knockout player assignment if it is still used there.
- Apply the persisted round-robin match format (`bo1` or `bo3`) to every generated match.

Tests: exact 8 players with team size 2 creates four teams and six matches, 9 players with team size 2 is rejected, self-joined players are included, duplicate roster names are rejected or deduplicated deterministically, BO3 setting creates BO3 round-robin matches, knockout player assignment behavior remains covered.

---

### T94 - Team Round-Robin Player Setup UI (TDD First)
**Files**: `app/admin/tournament/new/page.tsx`, `components/admin/TournamentSetupForm.tsx`, `components/player/JoinTournamentButton.tsx`, `lib/i18n.ts`, `__tests__/components/NewTournamentPage.test.tsx`, `__tests__/components/TournamentSetupPage.test.tsx`, `__tests__/components/JoinTournamentButton.test.tsx`, `__tests__/components/Localization.test.tsx`
**Depends on**: T92, T93
**TDD**: Write tests before implementation
**Description**: Expose team round-robin player entry in the admin UI:
- New tournament form lets tournament leads choose team round-robin with player-name entry.
- Self-join can be enabled for team round-robin player-entry tournaments.
- Round-robin match format control defaults to one set per match and can be changed to BO3.
- Setup page shows player entry/self-joined roster, exact-count requirement, and generated team preview.
- Start button is blocked with an inline message until `playerCount % teamSize === 0` and at least two generated teams exist.
- Shuffle/regenerate keeps teams equal-sized and updates the preview.
- Add German and English labels for the new controls and validation messages.

Tests: team round-robin player-entry option is selectable, self-join checkbox remains available, BO1 default is submitted, BO3 can be submitted, invalid player count blocks start with an inline message, valid exact roster generates equal teams, self-joined players appear in the setup roster, translations render for the new labels.
