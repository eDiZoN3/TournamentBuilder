# Tournament Builder - Task List

Reference documents: `plan.md` (architecture + models), `specify.md` (product spec), `techplan.md` (algorithms + edge cases), and `completed-tasks.md` for implemented tasks and dependency history.

Each task is atomic enough for a single coding session. TDD tasks write tests first, then implementation. Dependencies are listed as task IDs.

---

## Active Tasks

## Phase 18 — Multi-Category Event Overhaul (Issues 35–38)

---

### T137 — Group Matches Always Use Winner-Only Scoring
**Files**: `lib/models/TournamentGroup.ts`, `app/api/groups/[id]/categories/[catId]/matches/[matchId]/scores/route.ts`, `app/api/groups/[id]/categories/[catId]/matches/[matchId]/status/route.ts`, `__tests__/api/groups/`
**Depends on**: —
**TDD**: Write failing API tests first

**Description**: Multi-category events must never use set-score entry. Every group match should be handled exactly like a winner-only tournament match: admin marks the match in progress, then selects a winner — no set scores recorded. This task wires the winner-only behaviour into the group match API layer.

**Changes required**:

1. **`lib/models/TournamentGroup.ts`**: Add `matchResultMode: "winner_only"` as a fixed constant on `IGroupCategory` (not a configurable field — groups always are winner-only). Add the field to the Mongoose schema with a hard-coded default. No migration needed for existing documents since the value is always the same.

2. **Group match status route** (`/api/groups/[id]/categories/[catId]/matches/[matchId]/status`): Ensure the `start` action calls `assignCourt` with winner-only semantics (no court capacity check, sets `courtNumber = null`). The existing `assignCourt` in `lib/bracket/advance.ts` already handles `matchResultMode === "winner_only"` — the route just needs to pass the correct mode.

3. **Group match scores route** (`/api/groups/[id]/categories/[catId]/matches/[matchId]/scores`): The body should accept a simplified payload: `{ winnerId: string }` only — no set scores. Validate that `winnerId` matches one of the match's team IDs. Mark the match completed, set `winnerId`/`loserId`, call `advance` to propagate results. Do NOT call `validateSets` or the normal scoring pipeline.

4. **Advance for group matches**: `lib/bracket/advance.ts` `advanceAfterMatch` is already format-agnostic (it looks at `winnerId`/`loserId`). Confirm it works when called from the group scores route with no sets recorded.

**Tests** (write first):
- POST scores with `{ winnerId }` marks match completed and calls advance
- POST scores with invalid `winnerId` (not one of the two teams) returns 400
- POST scores on a non-in_progress match returns 409
- Status start action marks match in_progress with `courtNumber = null`

---

### T135 — Redesign Group Admin Management View (Tab-per-Category Bracket UI)
**Files**: `components/groups/GroupManageView.tsx`, `app/admin/groups/[id]/page.tsx`, `__tests__/components/GroupManageView.test.tsx`
**Depends on**: T137
**TDD**: Write/update component tests first

**Description**: The current `GroupManageView` renders a flat list of category rows. The user wants the group admin page to look and function exactly like `TournamentManageView`: a tab strip at the top (one tab per category), each tab showing the full bracket with `MatchCard` + `MatchControls` admin overlays. Since groups always use winner-only (T137), the admin controls show "Mark as in progress" and winner-selection buttons — never a score entry form.

**Changes required**:

1. **Tab strip**: Render a horizontal tab row above the bracket area. One tab per category (ordered by `position`), plus a "Standings" tab that shows `GroupLeaderboard`. The active tab is tracked in local state (`useState`), defaulting to the first category.

2. **Category bracket tab**: For the active category, render `BracketView` passing `category.matches` as matches and `group.teams` as teams (same as `PublicGroupView` already does). Layer `MatchControls` over each match card — wire it to the group match API endpoints (status, scores, override). Since `matchResultMode === "winner_only"`, `MatchControls` must receive `matchResultMode="winner_only"` so it renders winner-selection buttons instead of a score entry form.

3. **MatchControls API wiring for groups**: `MatchControls` currently targets `/api/tournaments/[id]/matches/[matchId]/...`. For groups the path is `/api/groups/[groupId]/categories/[catId]/matches/[matchId]/...`. Introduce an optional `apiBase` prop (or equivalent) to `MatchControls` so the caller can override the base URL. Pass `apiBase={/api/groups/${groupId}/categories/${cat._id}/}` from the group manage view.

4. **"Start group" button**: Keep the existing "Start group" button in the page header (visible only when status is `draft`). When group is active, show only the tab UI. When completed, default to the "Standings" tab.

5. **SWR / live refresh**: Retain the existing 5-second polling from `GroupManageView`. On each refresh, re-render the active tab with updated match data.

6. **Delete control**: Wire in `GroupDeleteControl` (from T136) in the page header alongside "Start group", same position as `TournamentDeleteControl` in the normal manage view.

**Component tests** (write first):
- Renders a tab per category plus a Standings tab
- Clicking a category tab shows its bracket (BracketView receives correct matches)
- Clicking Standings tab shows GroupLeaderboard
- MatchControls rendered for each match in the active category tab
- "Start group" button shown only when status is draft
- GroupDeleteControl present in header

---

### T136 — Add Delete UI for Multi-Category Events
**Files**: `components/groups/GroupDeleteControl.tsx` (new), `app/admin/groups/[id]/page.tsx`, `__tests__/components/GroupDeleteControl.test.tsx` (new)
**Depends on**: —
**TDD**: Write tests first

**Description**: The `DELETE /api/groups/[id]` API endpoint already exists and works (returns 204 on success, 409 if group is active). There is no UI to trigger it. Create a `GroupDeleteControl` client component following the same pattern as `TournamentDeleteControl`: a "Delete event" button that opens a confirmation dialog requiring the user to type the group name before confirming.

**API behaviour to know**:
- `DELETE /api/groups/[id]` — 204 success, 409 if `status === "active"`, 404 if not found, 403 if not admin
- Active groups cannot be deleted (the API enforces this). The UI should either hide the button for active groups or show a descriptive error when the API returns 409.

**Component spec**:

```tsx
interface GroupDeleteControlProps {
  groupId: string;
  groupName: string;
  onDeleted?: () => void;  // called after successful delete; navigate to /admin/groups
}
```

Behaviour:
- Shows a "Delete event" button
- On click, opens a modal/inline confirmation: "Type {groupName} to confirm deletion"
- User must type the exact name; confirm button is disabled until it matches
- On confirm: calls `DELETE /api/groups/[groupId]`, then calls `onDeleted()` / navigates to `/admin/groups`
- On 409: shows inline error "Active events cannot be deleted — complete or cancel it first"
- On other errors: shows generic "Delete failed" message

**Tests** (write first):
- Renders "Delete event" button
- Confirm button disabled until group name is typed correctly
- On successful delete (204), calls `onDeleted`
- On 409 response, shows "active events" error message
- On other non-OK response, shows generic delete error

---

### T138 — Rename "Groups" / "Gruppen" Public Nav Link to "Events"
**Files**: `lib/i18n.ts`, `__tests__/components/GroupNavigation.test.tsx`
**Depends on**: —
**TDD**: Update test first

**Description**: The public navbar (`Navbar.tsx:66`) renders `t("groups")`, currently "Groups" (EN) and "Gruppen" (DE). The user wants this link to say "Events" in both languages. Update the `groups` i18n display values only — do not rename the TypeScript key.

**Changes required**:

1. **`lib/i18n.ts`**: Update the `groups` key display values:
   - `de.groups`: `"Gruppen"` → `"Events"`
   - `en.groups`: `"Groups"` → `"Events"`

2. **Check for other uses of `t("groups")`**: Grep for `t("groups")` across the codebase. If it is used in other places where "Groups" is still the right label (e.g. headings on the groups list page), consider whether those should also say "Events" or keep the old value. If ambiguous, introduce a separate key `eventsNav` for the navbar only and leave `groups` unchanged elsewhere.

3. **`__tests__/components/GroupNavigation.test.tsx`**: The existing test "shows a Groups link in the public navbar" asserts the link text is "Groups". Update it to assert "Events".

**Tests** (update first):
- Public navbar renders a link with text "Events" (not "Groups")

---

## Phase 19 — Group Bracket Seeding Algorithm + Central "Up Next" (Issues 39–40)

> **Algorithm overview** (full derivation in `Documentation/group-seeding-algorithm.md`, written as part of T139).
>
> Each category is an independent **single-elimination** bracket over the *same* `N` teams, generated when the event starts. The entry order of teams is the seed order (no shuffle). Let `S = nextPowerOfTwo(N)`, byes per category `B = S − N`, R1 real matches `= N − S/2`, teams that play R1 `= 2N − S` (always even).
>
> The generator runs three phases per event:
>
> **Phase 1 — Seed-priority bye budget.** Desired byes by seed: team 1 → 4, team 2 → 3, team 3 → 2, every other team → 1, each capped at the number of categories `C` (max one bye per category per team). The *actual* total byes is fixed at `A = C·B` (a single-elim bracket always has exactly `B` byes). Reconcile the desired sum `T` with `A`:
> - `T > A` (deficit): strip byes starting from the **lowest** seed downward until the sum equals `A` (low seeds drop to 0 byes first).
> - `T < A` (surplus): add byes starting from the **highest** seed upward, each capped at `C`, until the sum equals `A`.
> - `B = 0` (N is a power of two): no byes exist; skip Phase 1 entirely.
> Result: a per-team bye count `b[i]` with `Σ b[i] = A` and `0 ≤ b[i] ≤ C`.
>
> **Phase 1b — Place byes into categories.** Realize the 0/1 matrix `X[team][category]` with row sums `b[i]` and every column sum `= B`. Greedy "highest remaining budget first" per category (Gale–Ryser realization, always succeeds when Phase 1 produced a valid `b`). Break ties among equal-budget teams **randomly** so the single byes of teams 4+ spread randomly across categories.
>
> **Phase 2 — Minimize cross-category rematches.** Maintain a global symmetric `met[i][j]` = how many times teams `i,j` have already been paired in round 1. For each category (in `position` order): the non-bye teams must be paired into `N − S/2` R1 matches; choose the **minimum-weight perfect matching** over those teams with edge weight `met[i][j]` (exact min-weight matching for small N, or greedy + 2-opt local search), then increment `met` for the chosen pairs. Only round 1 is deterministic — matchups in round 2+ depend on results and cannot be predetermined; this is a documented limitation. Lower bound on forced repeats: `max(0, C·(N − S/2) − N(N−1)/2)`.
>
> **Phase 3 — Build the real bracket.** Convert each category's chosen byes + pairs into an `S`-length ordered slot array (team or `null`) consistent with canonical seed positions (`generateSeedPositions`), then feed it through the existing single-elimination engine so `processGeneratedByes` marks bye matches completed and advances bye teams to R2. Output is the same `IMatch[]` the rest of the app already consumes.
>
> **Worked example** (N=6, C=4): S=8, B=2, A=8. Desired T = 4+3+2+1+1+1 = 12 > 8 → strip lowest seeds → `b = [4,3,1,0,0,0]`. Team 1 gets a bye in all 4 categories, team 2 in 3, team 3 in 1.

---

### T139 — Seed-Priority Bye Distribution Planner (pure, TDD)
**Files**: `lib/groups/byes.ts` (new), `Documentation/group-seeding-algorithm.md` (new), `__tests__/lib/groups/byes.test.ts` (new)
**Depends on**: —
**TDD**: Write failing unit tests first

**Description**: Implement Phase 1 + Phase 1b as pure functions. No DB, no React. Also write the full algorithm derivation to `Documentation/group-seeding-algorithm.md` (the overview above expanded with the reconciliation proof sketch and worked examples).

**Functions**:

```ts
export interface ByePlan {
  bracketSize: number;       // S
  byesPerCategory: number;   // B = S - N
  totalByes: number;         // A = C * B
  byeCount: number[];        // b[i], length N, indexed by seed (entry order)
}

// Phase 1: reconcile desired 4/3/2/1 budget against the fixed supply A = C*B.
export function planByeBudget(teamCount: number, categoryCount: number): ByePlan;

// Phase 1b: realize the 0/1 assignment matrix. Returns isBye[categoryIndex][teamIndex].
// `rng` injectable for deterministic tests (default Math.random).
export function assignByeCategories(
  plan: ByePlan,
  categoryCount: number,
  rng?: () => number,
): boolean[][];
```

**Tests** (write first):
- `planByeBudget(6, 4)` → `byeCount = [4,3,1,0,0,0]`, `byesPerCategory = 2`, `totalByes = 8`
- `planByeBudget(10, 2)` → byes per cat = 6, total = 12, `byeCount = [2,2,2,1,1,1,1,1,1,0]`
- `planByeBudget(5, 1)` → `byeCount = [1,1,1,0,0]` (top 3 seeds get the 3 byes)
- `planByeBudget(8, 4)` → `byesPerCategory = 0`, all `byeCount = 0` (power of two, no byes)
- surplus case `planByeBudget(5, 4)` → `byeCount` sums to `A = 12`, seed 1 capped at C=4, seed 2 bumped to 4
- `assignByeCategories`: every column sums to `byesPerCategory`; every row sums to `byeCount[i]`; no team exceeds 1 bye per category; total = `totalByes`
- `assignByeCategories` with a fixed seeded `rng` is deterministic and reproducible

---

### T140 — Cross-Category Matchup Minimizer (pure, TDD)
**Files**: `lib/groups/pairing.ts` (new), `__tests__/lib/groups/pairing.test.ts` (new)
**Depends on**: —
**TDD**: Write failing unit tests first

**Description**: Implement Phase 2. Given the set of non-bye team indices for one category and the running `met` matrix, return the round-1 pairing that minimizes the sum of `met` weights (minimum-weight perfect matching). Caller increments `met` after each category.

**Functions**:

```ts
// Minimum-weight perfect matching over `activeTeams` (even count) with weight met[i][j].
// Returns the chosen unordered pairs. Use exact matching for small inputs; greedy + 2-opt
// local search as a fallback for larger inputs.
export function planRoundOnePairs(
  activeTeams: number[],
  met: number[][],
): Array<[number, number]>;

// Convenience: run planRoundOnePairs across an ordered list of per-category active-team sets,
// threading and mutating a fresh met matrix; returns pairs per category plus the final met.
export function planAllPairings(
  perCategoryActiveTeams: number[][],
  teamCount: number,
): { pairsPerCategory: Array<Array<[number, number]>>; met: number[][] };
```

**Tests** (write first):
- Single category, all teams active, `met` all zeros → returns a valid perfect matching (every team in exactly one pair)
- Two categories where a zero-repeat pairing exists → minimizer produces zero repeated pairs
- Over-constrained case (more total matches than distinct pairs) → repeats equal the pigeonhole lower bound `C·(N−S/2) − N(N−1)/2`
- `met` is symmetric and incremented by exactly 1 per chosen pair per category
- Odd active count throws (guard — should never happen since `2N − S` is even)

---

### T141 — Group Bracket Generator (wire byes + pairings into real brackets, TDD)
**Files**: `lib/groups/generate.ts` (new), `lib/bracket/generate.ts` (extend), `app/api/groups/[id]/start/route.ts`, `__tests__/lib/groups/generate.test.ts` (new), `__tests__/lib/bracket/generate.test.ts` (extend)
**Depends on**: T139, T140
**TDD**: Write failing tests first

**Description**: Implement Phase 3 and orchestrate all phases into the event-start flow, replacing the current per-category `generateBracket(teams, 1, { knockoutBracketType: "single_elimination" })` (which shuffles and ignores cross-category variety).

**Changes required**:

1. **Extend `lib/bracket/generate.ts`** with an explicit first-round placement path. Add an option `firstRoundSlots?: Array<Types.ObjectId | null>` (length `S`, canonical seed-position order) and a `firstRoundPairingMode: "explicit"`. When supplied, skip the shuffle and the seeded/manual assignment and place those exact teams (or `null` for empty/bye sides) into R1, then let the existing `processGeneratedByes` run unchanged. Keep all current behaviour intact when the option is absent (regression-guard the existing tests).

2. **`lib/groups/generate.ts`** — orchestrator:
   ```ts
   export function generateGroupCategoryBrackets(
     teams: ITeam[],          // in entry order (seed order)
     categoryCount: number,
     rng?: () => number,
   ): IMatch[][];             // one IMatch[] per category, in position order
   ```
   Steps: `planByeBudget` → `assignByeCategories` → per category compute active (non-bye) teams → `planRoundOnePairs` (threading `met`) → build the `S`-length slot array (byes on canonical bye slots, pairs on mirror-position slots) → call the extended `generateBracket` with `firstRoundSlots`.

3. **`app/api/groups/[id]/start/route.ts`**: Replace the per-category generation loop with a single `generateGroupCategoryBrackets(group.teams, sortedCategories.length)` call and assign each result to the matching category by position. Keep the existing auto-schedule (`computeNextMatches`) afterward.

**Tests** (write first):
- `generateGroupCategoryBrackets` returns one bracket per category, each a valid single-elim `IMatch[]` over all N teams
- Byes in the generated brackets match the `assignByeCategories` plan (team 1 has a bye in the expected categories, etc.)
- R1 matchups across categories minimize repeats (assert repeat count ≤ pigeonhole bound for a known N/C)
- Team entry order is preserved (no shuffle) — seed 1 is always the configured top seed
- Extended `generateBracket` with `firstRoundSlots`: existing seeded/manual/random tests still pass (regression)
- Start route: starting an event with 3 categories generates 3 coordinated brackets and auto-activates the first match per category

---

### T142 — Central "Up Next" Panel for Events (TDD)
**Files**: `lib/groups/upNext.ts` (new), `components/groups/GroupUpNext.tsx` (new), `components/groups/GroupManageView.tsx`, `components/groups/PublicGroupView.tsx`, `lib/i18n.ts`, `__tests__/lib/groups/upNext.test.ts` (new), `__tests__/components/GroupUpNext.test.tsx` (new)
**Depends on**: — (coordinates with T135's tab layout; place the panel above the tabs)
**TDD**: Write failing tests first

**Description**: One central panel that always shows the next match for **every** category at once (in-progress match if one exists, otherwise the next playable match from `computeNextMatches`, otherwise a "category complete" state). Rendered at the top of both the admin manage view and the public view, above any per-category tabs.

**Changes required**:

1. **`lib/groups/upNext.ts`** — selector built on the existing scheduler:
   ```ts
   export interface CategoryUpNext {
     categoryIndex: number;
     categoryName: string;
     match: IGroupMatch | null;   // in-progress, else next ready; null when category complete
     state: "in_progress" | "next" | "complete";
   }
   export function computeUpNextPerCategory(group: ITournamentGroup): CategoryUpNext[];
   ```
   Reuse `computeNextMatches` for the "next" case; detect in-progress directly; mark "complete" when the category's final is completed and nothing is playable.

2. **`components/groups/GroupUpNext.tsx`**: Renders one row/card per category showing category name, the matchup (resolve team names from `group.teams`, same helper pattern as `GroupManageView`), and a state badge (LIVE / Up next / Complete). Localized via `useLocale()`.

3. Add i18n keys: `upNextPerCategory` ("Up Next" header), `categoryComplete` ("Complete" / "Abgeschlossen") — reuse existing `live`, `nextQueuedMatch`.

4. Mount `<GroupUpNext group={group} />` at the top of both `GroupManageView` and `PublicGroupView`.

**Tests** (write first):
- `computeUpNextPerCategory` returns one entry per category, ordered by `position`
- Category with an in-progress match → `state: "in_progress"`, that match returned
- Category with no active match but a playable next → `state: "next"`, the next match returned
- Category whose final is completed → `state: "complete"`, `match: null`
- `GroupUpNext` renders a row per category with resolved team names and the correct badge
- `GroupUpNext` shows localized header/badges in German locale
