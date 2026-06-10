# Tournament Builder - Task List

Reference documents: `plan.md` (architecture + models), `specify.md` (product spec), `techplan.md` (algorithms + edge cases), and `completed-tasks.md` for implemented tasks and dependency history.

Each task is atomic enough for a single coding session. TDD tasks write tests first, then implementation. Dependencies are listed as task IDs.

---

## Active Tasks

## Phase 14 - Remaining Roadmap and Issue Backlog

These tasks cover the currently unimplemented backlog items:
- `roadmap.md` item 9: knockout tournaments without a loser bracket, manual first-round pairing, winner-only completion, and configurable scoring behavior.
- `open-issues.md` item 26: score-entry card opacity/pulsing polish.
- `open-issues.md` item 27: localized tournament graph labels and place ranges.
- `open-issues.md` item 28: tournament creation switch for BO3 semi-finals/finals.

---

### T107 - Score Entry Modal Foreground Opacity Polish (TDD First)
**Files**: `components/admin/ScoreEntry.tsx`, `components/admin/TournamentManageView.tsx`, `components/admin/MatchControls.tsx`, `__tests__/components/ScoreEntry.test.tsx`, `__tests__/components/TournamentManageView.test.tsx`, `__tests__/components/UiPolish.test.tsx`
**Depends on**: T97
**TDD**: Write tests before implementation
**Description**: Remove the remaining opacity/pulse behavior from score-entry UI while a match is being edited:
- Keep the score-entry card/modal in the foreground at full opacity until scores are saved, confirmed, overridden, or dismissed.
- Ensure active-match highlighting behind the modal does not animate or visually compete with the score-entry surface.
- Preserve disabled-button opacity for actual disabled controls only.
- Keep keyboard focus, dismiss behavior, and toast/error flows unchanged.

Tests: score-entry modal has stable full-opacity classes, no pulse/animate opacity class is applied while open, active match row/card styling remains non-animated behind the modal, disabled controls still expose disabled state without dimming the whole modal.

---

### T108 - Localized Bracket Labels and Place Ranges (TDD First)
**Files**: `lib/bracket/labels.ts`, `lib/i18n.ts`, `components/bracket/MatchCard.tsx`, `components/bracket/RoundTabs.tsx`, `components/bracket/WinnerBracket.tsx`, `components/bracket/LoserBracket.tsx`, `__tests__/lib/bracket/labels.test.ts`, `__tests__/components/MatchCard.test.tsx`, `__tests__/components/BracketView.test.tsx`, `__tests__/components/Localization.test.tsx`
**Depends on**: T76, T91, T106
**TDD**: Write tests before implementation
**Description**: Localize tournament graph labels instead of displaying raw internal labels:
- Render "WB Semi-Final" as "Semi-Final" in English and "Halbfinale" in German.
- Render finals, quarter-finals, numbered rounds, winner/loser bracket headings, and place ranges through translation keys.
- Render place ranges like "1st-2nd Place" as localized display text, including German forms such as "1.-2. Platz".
- Keep persisted match labels/place ranges backward compatible for existing tournaments.
- Prefer a label metadata/helper layer over hard-coding translated strings into generated match documents.

Tests: label helpers return stable semantic labels, English and German match cards show localized finals/semi-finals/place ranges, round tabs use localized round labels, legacy stored labels still render correctly.

---

### T109 - Knockout Tournament Configuration Model and API (TDD First)
**Files**: `lib/models/Tournament.ts`, `app/api/tournaments/route.ts`, `app/api/tournaments/[id]/route.ts`, `app/api/tournaments/[id]/start/route.ts`, `lib/openapi.ts`, `__tests__/lib/models/Tournament.test.ts`, `__tests__/api/tournaments.test.ts`, `__tests__/api/start.test.ts`, `__tests__/api/openapi.test.ts`
**Depends on**: T104
**TDD**: Write tests before implementation
**Description**: Add persisted configuration for knockout tournament variants:
- Support knockout bracket type: double elimination with loser bracket, or single elimination without loser bracket.
- Support first-round pairing mode: random shuffle or manual order.
- Support result mode: point scoring or winner-only completion.
- Support finals match format mode: default BO3 semi-finals/finals, or BO1 all knockout matches.
- Default existing and newly created tournaments to the current behavior: double elimination, random pairing, point scoring, BO3 semi-finals/finals.
- Validate incompatible combinations, including winner-only mode forcing BO1 and not requiring BO3 configuration.
- Serialize the new fields through tournament list/detail APIs and document them in OpenAPI.

Tests: defaults preserve existing behavior, create rejects invalid enum values, detail/list responses include config fields, winner-only forces BO1-compatible config, OpenAPI documents the new request/response schema.

---

### T110 - Single-Elimination and Manual-Pairing Bracket Generation (TDD First)
**Files**: `lib/bracket/generate.ts`, `lib/bracket/advance.ts`, `lib/bracket/labels.ts`, `app/api/tournaments/[id]/start/route.ts`, `__tests__/lib/bracket/generate.test.ts`, `__tests__/lib/bracket/advance.test.ts`, `__tests__/lib/bracket/labels.test.ts`, `__tests__/api/start.test.ts`
**Depends on**: T109
**TDD**: Write tests before implementation
**Description**: Generate knockout brackets from the new tournament configuration:
- Generate single-elimination brackets with only winner-bracket matches and no loser-bracket matches.
- Preserve existing double-elimination generation when loser bracket is enabled.
- In random pairing mode, keep current shuffle/bye behavior.
- In manual pairing mode, keep entered team order: team 1 vs team 2, team 3 vs team 4, etc.
- Assign byes to unmatched teams when the team count does not fit a clean power-of-two graph.
- Apply configured finals format: BO3 semi-finals/finals when enabled, otherwise BO1 for all knockout matches.
- Ensure advancement and tournament completion work for both single and double elimination.

Tests: 3/5/6-team single-elimination brackets create correct byes and completion paths, manual 1v2 and 3v4 pairings are preserved, double elimination still matches existing snapshots, BO3 finals config affects only configured knockout matches, BO1-all config keeps every match BO1.

---

### T111 - Winner-Only Match Completion API (TDD First)
**Files**: `lib/scoring.ts`, `lib/bracket/advance.ts`, `app/api/tournaments/[id]/matches/[matchId]/status/route.ts`, `app/api/tournaments/[id]/matches/[matchId]/override/route.ts`, `components/admin/CompletedMatchControls.tsx`, `__tests__/lib/scoring.test.ts`, `__tests__/lib/bracket/advance.test.ts`, `__tests__/api/status.test.ts`, `__tests__/api/override.test.ts`, `__tests__/components/CompletedMatchControls.test.tsx`
**Depends on**: T109, T110
**TDD**: Write tests before implementation
**Description**: Allow configured tournaments to complete matches by selecting a winner without entering points:
- Add a server-side winner-only completion path for in-progress matches.
- Accept only team A or team B as the winner for winner-only matches with both teams present.
- Store winner/loser IDs without synthetic set scores.
- Reject score submission for winner-only tournaments and reject winner-only completion for point-scored tournaments.
- Support completed-match winner overrides in winner-only mode, including downstream rollback when the winner changes.
- Keep stats behavior clear: winner-only matches count wins/losses and games played, but do not add points-for/points-against.

Tests: winner-only completion advances brackets, invalid winner side is rejected, score endpoint rejects winner-only matches, point-scored tournaments reject winner-only payloads, override changes downstream matches, stats ignore point totals for winner-only results.

---

### T112 - Knockout Configuration UI in Tournament Creation and Setup (TDD First)
**Files**: `app/admin/tournament/new/page.tsx`, `components/admin/TournamentSetupForm.tsx`, `components/admin/AdminDashboard.tsx`, `lib/i18n.ts`, `__tests__/components/NewTournamentPage.test.tsx`, `__tests__/components/TournamentSetupPage.test.tsx`, `__tests__/components/AdminDashboard.test.tsx`, `__tests__/components/Localization.test.tsx`
**Depends on**: T109, T110
**TDD**: Write tests before implementation
**Description**: Expose knockout configuration to tournament leads:
- Add controls for double elimination vs single elimination.
- Add controls for random first-round pairing vs manual entered-order pairing.
- Add a points vs winner-only result-mode switch, defaulting to points.
- Add the semi-final/final BO3 switch requested in issue 28, defaulting to enabled for point-scored knockout tournaments.
- Hide or disable BO3 controls when winner-only mode is selected.
- Keep round-robin and individual-mixer configuration unaffected.
- Localize all new labels, help text, validation errors, and button states in English and German.

Tests: default create form submits existing config, single-elimination/manual/winner-only options submit expected payloads, BO3 switch is present for point-scored knockout tournaments, BO3 switch is disabled/hidden in winner-only mode, round-robin forms do not show irrelevant knockout controls, localization covers all new strings.

---

### T113 - Knockout Variant Public and Admin Views (TDD First)
**Files**: `components/bracket/BracketView.tsx`, `components/bracket/WinnerBracket.tsx`, `components/bracket/LoserBracket.tsx`, `components/bracket/PublicTournamentView.tsx`, `components/admin/MatchControls.tsx`, `components/admin/ScoreEntry.tsx`, `components/admin/TournamentManageView.tsx`, `components/stats/TournamentStats.tsx`, `__tests__/components/BracketView.test.tsx`, `__tests__/components/PublicTournamentView.test.tsx`, `__tests__/components/MatchControls.test.tsx`, `__tests__/components/ScoreEntry.test.tsx`, `__tests__/components/TournamentManageView.test.tsx`, `__tests__/components/StatsTable.test.tsx`
**Depends on**: T108, T111, T112
**TDD**: Write tests before implementation
**Description**: Render and manage the new knockout variants correctly:
- Hide loser-bracket tabs/sections/empty states when a tournament is single elimination.
- Keep double-elimination layouts unchanged.
- For winner-only tournaments, show winner selection controls instead of score-entry controls.
- Keep score-entry UI available only for point-scored matches.
- Show completed winner-only matches without empty score columns.
- Keep public brackets, admin manage views, and tournament stats responsive for the new variants.

Tests: single-elimination public/admin pages render only winner bracket, double elimination still renders both brackets, winner-only controls complete matches from manage view, score modal is absent in winner-only mode, completed winner-only match cards show winner without scores, stats tables handle missing point totals.

---

### T114 - Roadmap and Issue Completion Validation (TDD First)
**Files**: `roadmap.md`, `open-issues.md`, `implemented-roadmap.md`, `implemented-issues.md`, `completed-tasks.md`, `__tests__/api/start.test.ts`, `__tests__/api/status.test.ts`, `__tests__/components/NewTournamentPage.test.tsx`, `__tests__/components/PublicTournamentView.test.tsx`
**Depends on**: T107, T108, T109, T110, T111, T112, T113
**TDD**: Write tests before implementation
**Description**: Close out the remaining backlog once implementation tasks are complete:
- Add end-to-end regression tests that cover creating a single-elimination manual-pairing winner-only tournament and playing it to completion.
- Add regression tests for a point-scored knockout tournament with BO3 finals disabled.
- Verify existing double-elimination, round-robin, player self-join, and stats flows still pass.
- Move roadmap item 9 and open-issue items 26-28 into the implemented backlog files only after tests and build pass.
- Archive completed active tasks to `completed-tasks.md` in the existing style.

Tests: full single-elimination winner-only flow, full point-scored BO1-finals flow, existing test suite, `npm run test:coverage`, `npm run build`.
