# Tournament Builder - Task List

Reference documents: `plan.md` (architecture + models), `specify.md` (product spec), `techplan.md` (algorithms + edge cases), and `completed-tasks.md` for implemented tasks and dependency history.

Each task is atomic enough for a single coding session. TDD tasks write tests first, then implementation. Dependencies are listed as task IDs.

---

## Active Tasks

## Phase 11 - Roadmap Feature 7: Player Practice Matches

Roadmap feature 7: players can create small practice matches that do not belong to a tournament. Practice matches count toward personal practice stats, but tournament stats and practice stats stay separated in the global stats view and player account view.

### T86 - Practice Match Model and Validation (TDD First)
**Files**: `lib/models/PracticeMatch.ts`, `lib/practiceMatches.ts`, `__tests__/lib/models/PracticeMatch.test.ts`, `__tests__/lib/practiceMatches.test.ts`
**Depends on**: T12, T61
**TDD**: Write tests before implementation
**Description**: Add a separate practice-match domain model for player-created non-tournament matches:
- Store practice matches separately from tournaments so tournament history and bracket stats are not mixed with practice data.
- Link each match to a creator `playerProfileId`; the creator must appear on one side of the match.
- Support two sides with equal side sizes from 1 to 4 players per side.
- Participants can reference registered `playerProfileId` values and may include display names for snapshot/history stability.
- Store played date, set scores, winner side, and timestamps.
- Reuse existing scoring validation rules for set validity and match winner calculation.
- Reject invalid player IDs, duplicate participants in one match, uneven side sizes, empty sides, invalid set scores, and matches without a winner.

Tests: model requires creator and participants, creator must participate, duplicate participant rejected, side sizes must match, valid 1v1 and 2v2 matches save, invalid set scores are rejected, winner side is derived consistently from saved sets.

---

### T87 - Player Practice Match API (TDD First)
**Files**: `app/api/practice-matches/route.ts`, `app/api/practice-matches/[id]/route.ts`, `lib/practiceMatches.ts`, `__tests__/api/practice-matches.test.ts`
**Depends on**: T80, T86
**TDD**: Write tests before implementation
**Description**: Add authenticated player APIs to manage their own practice matches:
- `GET /api/practice-matches` returns practice matches visible to the signed-in player, sorted by newest first.
- `POST /api/practice-matches` creates a completed practice match for the signed-in player.
- `PUT /api/practice-matches/[id]` updates a practice match created by the signed-in player.
- `DELETE /api/practice-matches/[id]` removes a practice match created by the signed-in player.
- Players can only mutate practice matches they created.
- Non-player sessions and anonymous requests are rejected.
- API responses serialize stable player display names and omit internal Mongoose fields.

Tests: anonymous request rejected, admin/tournament lead rejected, player creates a valid match, invalid payload rejected, player lists own related matches, player cannot edit another creator's match, update recalculates winner, delete removes only own match.

---

### T88 - Separate Practice Stats Aggregation (TDD First)
**Files**: `lib/practiceStats.ts`, `lib/stats.ts`, `app/api/stats/route.ts`, `app/api/practice-matches/stats/route.ts`, `__tests__/lib/practiceStats.test.ts`, `__tests__/api/stats.test.ts`
**Depends on**: T83, T86, T87
**TDD**: Write tests before implementation
**Description**: Calculate practice-match stats separately from tournament stats:
- Aggregate practice stats by stable `playerProfileId` where possible, using stored display-name snapshots for rendering.
- Count matches played, matches won/lost, sets won/lost, points for/against, point diff, and win rate.
- Do not merge practice matches into tournament team stats or tournament player stats.
- Keep the existing `/api/stats` response backward compatible for tournament stats while adding a separate `practicePlayers` collection.
- Add a focused practice stats API for player/account views if needed.
- Apply existing `player` and `all` stats reset rules to practice stats; tournament and season resets only affect tournament-derived stats.

Tests: practice stats count wins and points for registered players, guests do not create global player rows unless explicitly linked to a profile, tournament stats remain unchanged by practice matches, `/api/stats` includes separate practice rows, player reset hides that player's practice stats, all reset returns empty tournament and practice stats.

---

### T89 - Player Account Practice Match UI (TDD First)
**Files**: `app/(public)/account/page.tsx`, `components/player/PlayerAccountView.tsx`, `components/player/PracticeMatchForm.tsx`, `components/player/PracticeMatchList.tsx`, `__tests__/components/PlayerAccountView.test.tsx`, `__tests__/components/PracticeMatchForm.test.tsx`, `__tests__/components/PracticeMatchList.test.tsx`
**Depends on**: T62, T87, T88
**TDD**: Write tests before implementation
**Description**: Let players create and review practice matches from their account page:
- Show tournament stats and practice stats as separate account sections.
- Add a practice-match form for side A/side B participants and set scores.
- Default the signed-in player into one side and prevent removing them from the match.
- Validate set scores client-side before submitting.
- Show a list of the player's practice matches with date, participants, score, and result.
- Allow the creator to edit or delete a practice match.
- Show empty, loading, success, and error states without layout shift.
- Keep the UI responsive on mobile and compatible with dark mode.

Tests: account page renders separate tournament and practice stat summaries, form defaults current player, invalid scores block submit, successful create calls the API and refreshes the list, practice match list renders results, edit updates a match, delete removes a match, empty state renders for players with no practice matches.

---

### T90 - Global Stats Practice Tables (TDD First)
**Files**: `app/(public)/stats/page.tsx`, `components/stats/StatsTable.tsx`, `components/stats/PracticeStatsSection.tsx`, `__tests__/components/StatsTable.test.tsx`, `__tests__/components/PublicPages.test.tsx`
**Depends on**: T75, T88
**TDD**: Write tests before implementation
**Description**: Update the global stats page so tournament and practice stats are visibly separate:
- Keep existing team stats and tournament player stats tables.
- Add a separate practice player stats table using the practice aggregation output.
- Label tables clearly so users can distinguish tournament player stats from practice match stats.
- Preserve empty states for each stats category independently.
- Keep mobile table behavior responsive and readable.
- Do not show practice data inside per-tournament stats pages.

Tests: global stats page renders team, tournament-player, and practice-player tables, practice rows do not appear in tournament player table, tournament rows do not appear in practice table, each empty state is independent, mobile/responsive table classes remain present.

---

### T91 - Practice Match Polish, Localization, and API Docs (TDD First)
**Files**: `lib/i18n.ts`, `components/ui/Navbar.tsx`, `lib/openapi.ts`, `__tests__/components/Localization.test.tsx`, `__tests__/api/openapi.test.ts`, `__tests__/components/ApiDocsPage.test.tsx`
**Depends on**: T87, T89, T90
**TDD**: Write tests before implementation
**Description**: Finish the cross-cutting pieces for the practice-match feature:
- Add German and English translations for practice-match labels, empty states, form controls, and errors.
- Add navigation from the player account area to the practice-match section without cluttering anonymous navigation.
- Document the new practice-match endpoints and schemas in the OpenAPI document.
- Ensure Swagger UI still points at the updated `/api/openapi` document.
- Verify dark-mode and mobile class coverage for the new UI components.
- Keep wording tests tied to translation keys so copy changes do not break unrelated tests.

Tests: German account UI shows translated practice labels, OpenAPI lists practice-match routes and schemas, Swagger docs page still renders, player navigation exposes practice matches only for signed-in players, anonymous navigation remains unchanged.

Implemented issue-resolution tasks for issues 10-19 were archived to `completed-tasks.md`.
Issue 20 in `issues.md` is empty and has no task until a concrete requirement is added.
