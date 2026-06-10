# Tournament Builder - Task List

Reference documents: `plan.md` (architecture + models), `specify.md` (product spec), `techplan.md` (algorithms + edge cases), and `completed-tasks.md` for implemented tasks and dependency history.

Each task is atomic enough for a single coding session. TDD tasks write tests first, then implementation. Dependencies are listed as task IDs.

---

## Active Tasks

## Phase 14 - Remaining Roadmap and Issue Backlog

These tasks cover the currently unimplemented backlog items:
- `open-issues.md` item 26: score-entry card opacity/pulsing polish.
- `open-issues.md` item 27: localized tournament graph labels and place ranges.

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

### T114 - Roadmap and Issue Completion Validation (TDD First)
**Files**: `open-issues.md`, `implemented-issues.md`, `completed-tasks.md`, `__tests__/components/ScoreEntry.test.tsx`, `__tests__/components/BracketView.test.tsx`, `__tests__/components/Localization.test.tsx`
**Depends on**: T107, T108
**TDD**: Write tests before implementation
**Description**: Close out the remaining issue backlog once implementation tasks are complete:
- Add regression tests for the score-entry opacity polish and localized bracket labels.
- Verify existing double-elimination, single-elimination, round-robin, player self-join, and stats flows still pass.
- Move open-issue items 26-27 into the implemented backlog file only after tests and build pass.
- Archive completed active tasks to `completed-tasks.md` in the existing style.

Tests: issue 26 opacity regression, issue 27 localization regression, existing test suite, `npm run test:coverage`, `npm run build`.
