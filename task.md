# Tournament Builder - Task List

Reference documents: `plan.md` (architecture + models), `specify.md` (product spec), `techplan.md` (algorithms + edge cases), and `completed-tasks.md` for implemented tasks and dependency history.

Each task is atomic enough for a single coding session. TDD tasks write tests first, then implementation. Dependencies are listed as task IDs.

---

## Active Tasks

## Phase 17 — Open Issue Fixes (Issues 32–34)

---

### T132 — Make Tournament Groups Accessible and Rename Feature
**Files**: `components/ui/AdminSidebar.tsx`, `app/admin/groups/page.tsx`, `app/admin/groups/new/page.tsx`, `app/admin/groups/[id]/page.tsx`, `lib/i18n.ts`
**Depends on**: —

**Description**: The tournament groups feature (`/admin/groups/`) is fully implemented in backend and API but unreachable — `AdminSidebar.tsx` has no link to it, so admins and tournament leads cannot navigate there. Additionally, the term "groups" is too generic; the user wants a clearer name that describes the functionality (running multiple parallel single-elimination categories for the same pool of teams).

Two things to do:

1. **Add navigation link**: In `AdminSidebar.tsx`, add a link to `/admin/groups` below the Dashboard link. The label should use the renamed term (see below). The link must be visible to both `admin` and `tournament_lead` roles (same guard as the rest of the sidebar).

2. **Rename the feature**: Replace "Tournament Groups" / "Turniergruppen" with a more descriptive term. Suggested: **"Multi-Category Tournament"** / **"Multi-Kategorie Turnier"** (describes the core idea: one event, multiple disciplines, one team pool). Update the following i18n keys in `lib/i18n.ts` (both `de` and `en` objects) to reflect the new name:
   - `tournamentGroups` → display as "Multi-Category Tournaments" / "Multi-Kategorie Turniere"
   - `newGroup` → display as "New event" / "Neues Event" (or aligned to chosen name)
   - `noGroupsYet` → display as "No multi-category events yet." / "Noch keine Multi-Kategorie Events."
   - `group` / `groups` → update to match the chosen term
   The i18n key names themselves (the TypeScript string literals) do not need to change — only the display values.

3. **Align `app/admin/groups/page.tsx` with app standards**: The page currently hardcodes English strings and uses plain Tailwind without the app's dark-mode or design token patterns. Convert it to use `useLocale()` (wrap in a client `GroupsListPage` component, same pattern as `AdminDashboard`) and apply consistent card/table styling matching the rest of the admin UI. Use the existing i18n keys where they already exist.

No new tests required for this task (UI-only changes; sidebar navigation is covered by visual inspection).

---

### T133 — Remove Pulsating Animation from Live Match Cards (TDD)
**Files**: `components/bracket/MatchCard.tsx`, `__tests__/components/MatchCard.test.tsx`
**Depends on**: —
**TDD**: Update tests before implementation

**Description**: Live (in-progress) match cards currently animate with `animate-pulse` (Tailwind's opacity oscillation) unless the score-entry modal is open (`isPinned=true`). The user wants the pulsating removed entirely — only the amber/yellow border and ring should remain as the live indicator.

Fix:

1. **`components/bracket/MatchCard.tsx` line 114**: Remove `animate-pulse` entirely. The `isPinned` conditional exists only to suppress the pulse, so it can be removed from this class string too. Keep the amber styling unchanged:
   ```tsx
   // before
   `${isPinned ? "" : "animate-pulse "}border-amber-400 ring-2 ring-amber-200 dark:border-amber-500 dark:ring-amber-700`
   // after
   "border-amber-400 ring-2 ring-amber-200 dark:border-amber-500 dark:ring-amber-700"
   ```

2. **`__tests__/components/MatchCard.test.tsx`** — three existing tests reference `animate-pulse` and must be updated:
   - Line 57: test "live match card has animate-pulse" → change assertion to `not.toHaveClass("animate-pulse")` and rename test to confirm no pulse on live match
   - Line 203: test "suppresses animate-pulse on a pinned live match card" → update or remove (pulse no longer applies in either state)
   - Line 226/242: test "retains animate-pulse on a live match card that is not pinned" → invert: confirm `animate-pulse` is absent even when not pinned

   After the fix, the amber border/ring must still be present for live matches in all pinned/unpinned states — add or keep assertions for `border-amber-400`.

Tests (update first, then implement):
- Live match card (not pinned): does **not** have `animate-pulse`; does have amber border class
- Live match card (pinned): does **not** have `animate-pulse`; does have amber border class
- Completed match card: no amber border (regression guard)
- Pending match card: no amber border (regression guard)

---

### T134 — Localize All Group UI Components (TDD)
**Files**: `components/groups/GroupSetupForm.tsx`, `components/groups/GroupManageView.tsx`, `components/groups/GroupLeaderboard.tsx`, `lib/i18n.ts`, `__tests__/components/GroupSetupForm.test.tsx`, `__tests__/components/GroupManageView.test.tsx`, `__tests__/components/GroupLeaderboard.test.tsx`
**Depends on**: T132
**TDD**: Write/update tests before implementation

**Description**: Every group UI component renders hardcoded English strings and none of them call `useLocale()`. Additionally, `GroupLeaderboard` uses an English-only `ordinal()` function (producing "1st", "2nd", "3rd") that produces wrong output for German (should be "1.", "2.", "3."). Issue 34 asks for meaningful German translations everywhere in the frontend; group components are the primary gap.

**New i18n keys to add** (add to both `de` and `en` in `lib/i18n.ts` and the `TranslationKey` type union):
- `createGroup` — "Gruppe erstellen" / "Create group"
- `rank` — "Rang" / "Rank"
- `failedToStartGroup` — "Gruppe konnte nicht gestartet werden." / "Failed to start group."
- `failedToCreateGroup` — "Gruppe konnte nicht erstellt werden." / "Failed to create group."
- `failedToSaveTeams` — "Teams konnten nicht gespeichert werden." / "Failed to save teams."
- `failedToSaveCategories` — "Kategorien konnten nicht gespeichert werden." / "Failed to save categories."
- `enterScores` already exists — reuse it in `GroupManageView`

**Locale-aware ordinal**: Add a `localizeOrdinal(n: number, locale: Locale): string` helper to `lib/i18n.ts`. German format: `"${n}."` (e.g. "1.", "2.", "3."). English format: existing suffix logic ("1st", "2nd", "3rd", "4th"). Use this helper in `GroupLeaderboard` instead of the hardcoded `ordinal()` function.

**Per-component changes**:

`GroupSetupForm.tsx`:
- Add `useLocale()` call
- Replace all hardcoded strings with `t(key)` lookups: "Group name" → `t("groupName")`, "Teams" → `t("teams")`, "Categories" → `t("categories")`, "Add team" → `t("addTeam")`, "Add category" → `t("addCategory")`, "Create group" → `t("createGroup")`, validation/error messages → new keys above
- `"Team name"` placeholder → `t("teamNameField")` already has this pattern

`GroupManageView.tsx`:
- Add `useLocale()` call
- Replace: "Start group" → `t("startGroup")`, "Failed to start group." → `t("failedToStartGroup")`, "Enter scores" → `t("enterScores")`, "Next up:" → `t("nextQueuedMatch")`, "Waiting — teams occupied" → `t("idleWaitingForTeams")`

`GroupLeaderboard.tsx`:
- Add `useLocale()` call
- Replace: "Rank" → `t("rank")`, "Total Score" → `t("totalScore")`
- Replace `ordinal(row.placements[catIndex])` → `localizeOrdinal(row.placements[catIndex], locale)`

Tests (write/update first):
- `GroupSetupForm`: renders "Gruppe erstellen" submit button in German locale; renders "Create group" in English locale
- `GroupSetupForm`: shows localized validation error in German when fewer than 2 teams entered
- `GroupManageView`: renders "Gruppe starten" button in German locale when group is draft
- `GroupManageView`: renders "Gruppe starten" → "Ergebnisse eingeben" in German locale for active match
- `GroupLeaderboard`: renders "Rang" column header in German locale; renders "Rank" in English locale
- `GroupLeaderboard`: renders "1." in German locale for 1st-place cell; renders "1st" in English locale
- `localizeOrdinal` unit tests in `lib/i18n.test.ts` (or add to existing): returns "1.", "2.", "3." for German; returns "1st", "2nd", "3rd" for English
