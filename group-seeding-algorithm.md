# Multi-Category Event Bracket Seeding Algorithm

Reference for the bracket generation used by **multi-category events** (a.k.a. tournament groups): a pool of `N` teams competes in `C` categories, each category being an independent single-elimination bracket over the *same* team pool.

This document specifies how byes and first-round matchups are assigned across all categories so that:

1. **Entry order is the seed order** — no shuffle. The team entered first is seed 1.
2. **Top seeds get a bye advantage** — seed 1 wants 4 byes, seed 2 wants 3, seed 3 wants 2, everyone else wants 1, with **at most one bye per category per team**.
3. **Opponents are varied** — after byes are fixed, fill the brackets so teams meet as many *different* opponents as possible across categories; unavoidable rematches are minimized.

It is implemented across `lib/groups/byes.ts` (Phase 1), `lib/groups/pairing.ts` (Phase 2), and `lib/groups/generate.ts` (Phase 3), and replaces the old per-category `generateBracket(teams, 1, { knockoutBracketType: "single_elimination" })` call (which shuffled each category independently and coordinated nothing).

---

## 1. Notation

| Symbol | Meaning |
|--------|---------|
| `N` | number of teams in the pool |
| `C` | number of categories |
| `S` | bracket size = `nextPowerOfTwo(N)` |
| `B` | byes per category = `S − N` |
| `A` | total byes across the event = `C · B` |
| `seed(i)` | team at entry position `i` (1-indexed); seed 1 = first entered |
| `b[i]` | number of byes assigned to seed `i` (summed over all categories) |
| `met[i][j]` | number of times seeds `i` and `j` have already been paired in round 1 |

Derived facts for a single-elimination bracket of size `S` over `N` teams:

- Round 1 has `S/2` match slots.
- Exactly `B = S − N` teams receive a first-round bye (these are *fixed* by the bracket size — you cannot have more or fewer).
- Teams that actually play round 1 = `N − B = 2N − S`. This is **always even**, so a perfect pairing of the round-1 teams always exists.
- Round-1 real matches = `(2N − S) / 2 = N − S/2`.

> **Why the bye count is fixed.** A bracket of size `S` has `S` leaf positions and `N` teams. The `S − N` empty leaves each pair with a real team in round 1, and that real team advances unopposed — a bye. There is no freedom in *how many* byes exist, only in *which teams* get them and *in which categories*.

---

## 2. Overview

Generation runs three phases when an event is started:

```
Phase 1   planByeBudget(N, C)         → b[]      (how many byes each seed gets)
Phase 1b  assignByeCategories(...)    → X[c][i]  (which category each bye lands in)
Phase 2   planRoundOnePairs(...)      → pairs    (R1 matchups, minimizing rematches)
Phase 3   generateGroupCategoryBrackets(...) → IMatch[][]  (real brackets)
```

Phases 1 and 2 are pure combinatorics. Phase 3 converts the plan into the same `IMatch[]` structure the rest of the app already consumes, reusing the existing single-elimination engine.

---

## 3. Phase 1 — Seed-priority bye budget

### 3.1 Desired budget

Each seed has a *desired* number of byes, capped by the number of categories (a team can hold at most one bye per category):

```
desired(1) = min(4, C)
desired(2) = min(3, C)
desired(3) = min(2, C)
desired(i) = min(1, C) = 1     for i ≥ 4   (assuming C ≥ 1)
```

Let `T = Σ desired(i)`.

### 3.2 The reconciliation problem

The event must place **exactly** `A = C · B` byes (Section 1). The desired sum `T` rarely equals `A`, so the budget is reconciled:

- **`B = 0`** (i.e. `N` is a power of two): there are no byes anywhere. Skip Phase 1 entirely; every team plays round 1 in every category. `b[i] = 0` for all `i`.
- **`T > A` (deficit)**: too many byes wanted. Remove byes starting from the **lowest** seed and working up, until the total equals `A`. Low seeds drop to 0 byes first; the top-seed advantage is preserved as long as possible.
- **`T < A` (surplus)**: too few byes wanted. Add byes starting from the **highest** seed and working down, each capped at `C`, until the total equals `A`. Surplus reinforces the strongest seeds.
- **`T = A`**: assign the desired budget as-is.

Result: a vector `b[i]` with `Σ b[i] = A` and `0 ≤ b[i] ≤ C`.

### 3.3 Pseudocode

```text
function planByeBudget(N, C):
    S = nextPowerOfTwo(N)
    B = S - N
    A = C * B
    b = new int[N]
    if B == 0:
        return { S, B, A, byeCount: b }        # all zero

    b[0] = min(4, C); b[1] = min(3, C); b[2] = min(2, C)
    for i in 3 .. N-1: b[i] = min(1, C)
    T = sum(b)

    while T > A:                               # deficit: strip lowest seed first
        for i from N-1 downto 0:
            if b[i] > 0: b[i] -= 1; T -= 1; break
    while T < A:                               # surplus: feed highest seed first
        for i from 0 to N-1:
            if b[i] < C: b[i] += 1; T += 1; break

    return { S, B, A, byeCount: b }
```

**Termination.** The deficit loop always finds a positive entry while `T > A ≥ 0`. The surplus loop always finds an entry below cap because the total cap `N·C` strictly exceeds `A = C·B` (since `B = S − N < N` for any non-power-of-two `N`; the power-of-two case has `B = 0` and is handled separately). Both loops therefore halt with `Σ b = A`.

### 3.4 Phase 1b — Placing byes into categories

Given `b[i]` and `B` byes per category, realize a 0/1 matrix `X[c][i]` (`c` = category, `i` = seed) with:

- row constraint: `Σ_c X[c][i] = b[i]` (team `i` gets exactly `b[i]` byes),
- column constraint: `Σ_i X[c][i] = B` (each category has exactly `B` byes),
- `X[c][i] ∈ {0, 1}` (at most one bye per category per team).

This is a bipartite degree-sequence realization. Because Phase 1 guarantees `b[i] ≤ C` and `Σ b[i] = C·B`, the **Gale–Ryser** conditions hold, so the greedy *"fill each category with the `B` teams having the largest remaining budget"* always succeeds.

```text
function assignByeCategories(plan, C, rng):
    rem = copy(plan.byeCount)                  # remaining budget per team
    X = new bool[C][N]
    for c in 0 .. C-1:
        candidates = teams sorted by (rem desc, random(rng) for ties)
        pick the first B candidates with rem > 0
        for each picked team i: X[c][i] = true; rem[i] -= 1
    assert all rem == 0
    return X
```

Ties among equal-budget teams are broken **randomly** (injectable `rng` for deterministic tests) so the single byes of seeds 4+ scatter across categories rather than always landing in the first few.

---

## 4. Phase 2 — Minimize cross-category rematches

Only **round 1** matchups are deterministic. Round 2 and beyond depend on who wins, so they cannot be predetermined — see [Limitations](#7-limitations). Phase 2 therefore minimizes repeated *first-round* pairings.

Maintain a symmetric matrix `met[i][j]`, initially all zeros. Process categories in `position` order. For each category:

1. `active` = the teams **not** assigned a bye in this category (size `2N − S`).
2. Choose a **minimum-weight perfect matching** over `active`, where the weight of pairing `i` with `j` is `met[i][j]`. (Pairs that have never met cost 0 and are preferred.)
3. Those pairs become the category's round-1 matches.
4. Increment `met[i][j] += 1` for each chosen pair.

```text
function planRoundOnePairs(active, met):
    # exact min-weight perfect matching for small inputs (blossom),
    # or greedy-lowest-weight + 2-opt local search as a fallback
    return matching minimizing Σ met[i][j] over chosen pairs

function planAllPairings(perCategoryActiveTeams, N):
    met = zero matrix N×N
    pairsPerCategory = []
    for active in perCategoryActiveTeams:      # position order
        pairs = planRoundOnePairs(active, met)
        for (i, j) in pairs: met[i][j] += 1; met[j][i] += 1
        pairsPerCategory.push(pairs)
    return { pairsPerCategory, met }
```

### 4.1 How many rematches are unavoidable?

- Distinct unordered pairs available: `N(N − 1) / 2`.
- Total round-1 matchups generated: `C · (N − S/2)`.
- Lower bound on forced repeats: `max(0, C·(N − S/2) − N(N − 1)/2)`.

The matching constraints (each team in exactly one pair per category) can push the real minimum slightly above this pigeonhole bound, but it is a useful sanity check for tests. Greedy + local search reaches the bound on the small `N`/`C` typical of these events; processing-order randomization with "keep best of K runs" can be layered on if needed.

---

## 5. Phase 3 — Build the real bracket

Each category now has a set of bye teams and a set of round-1 pairs. Convert this into the engine's `IMatch[]`:

1. Build an `S`-length **slot array** (team or `null`) in canonical seed-position order (`generateSeedPositions(S)`), such that:
   - each chosen pair occupies a mirror-position slot pair `(p, S+1−p)` with both sides filled,
   - each bye team occupies a slot whose mirror is `null` (an empty leaf),
   - byes are spread across distinct sub-trees (canonical seeding placement), keeping the tree balanced.
2. Feed the slot array into the single-elimination engine via the extended `generateBracket(..., { firstRoundPairingMode: "explicit", firstRoundSlots })`. The existing `processGeneratedByes` then marks each bye match completed and advances the bye team into round 2 — unchanged from today.

The number of slots reconciles exactly: `(N − S/2)` paired matches use two sides each and `B` bye matches use one side each, totalling `S/2` round-1 slots = all of them.

```text
function generateGroupCategoryBrackets(teams /* entry order */, C, rng):
    plan = planByeBudget(teams.length, C)
    X    = assignByeCategories(plan, C, rng)
    perCategoryActive = for each category c: teams whose X[c] is false
    { pairsPerCategory } = planAllPairings(perCategoryActive, teams.length)
    brackets = []
    for c in 0 .. C-1:
        slots = buildSlotArray(plan.S, byeTeams=X[c], pairs=pairsPerCategory[c])
        brackets.push(generateBracket(teams, courts=1, {
            knockoutBracketType: "single_elimination",
            firstRoundPairingMode: "explicit",
            firstRoundSlots: slots,
        }))
    return brackets        # one IMatch[] per category, in position order
```

The event-start route (`app/api/groups/[id]/start/route.ts`) calls this once and assigns each result to its category by position, then runs the existing `computeNextMatches` auto-schedule.

---

## 6. Worked examples

### Example A — N = 6, C = 4
`S = 8`, `B = 2`, `A = 8`.
Desired: `[4, 3, 2, 1, 1, 1]`, `T = 12 > A = 8` (deficit 4).
Strip lowest seeds: seed 6 → 0, seed 5 → 0, seed 4 → 0, seed 3 → 1.
**`b = [4, 3, 1, 0, 0, 0]`.** Seed 1 byes in all 4 categories, seed 2 in 3, seed 3 in 1. (Supply is too small for the "everyone gets 1" rule, so it yields to the top-seed advantage.)

### Example B — N = 10, C = 2
`S = 16`, `B = 6`, `A = 12`.
Desired: `[min(4,2), min(3,2), min(2,2), 1×7] = [2, 2, 2, 1, 1, 1, 1, 1, 1, 1]`, `T = 13 > 12` (deficit 1).
Strip seed 10 → 0. **`b = [2, 2, 2, 1, 1, 1, 1, 1, 1, 0]`.** Seeds 1–3 bye in both categories; seeds 4–9 get one bye each; seed 10 gets none.

### Example C — N = 5, C = 1
`S = 8`, `B = 3`, `A = 3`.
Desired: `[min(4,1), min(3,1), min(2,1), 1, 1] = [1, 1, 1, 1, 1]`, `T = 5 > 3` (deficit 2).
Strip seeds 5 and 4 → 0. **`b = [1, 1, 1, 0, 0]`** — the top 3 seeds take the 3 byes, exactly standard single-elim seeding.

### Example D — surplus, N = 5, C = 4
`S = 8`, `B = 3`, `A = 12`.
Desired: `[4, 3, 2, 1, 1]`, `T = 11 < 12` (surplus 1).
Seed 1 is already at cap `C = 4`; feed seed 2: `3 → 4`. **`b = [4, 4, 2, 1, 1]`**, sum 12. (With many categories and few teams, the cap forces the runner-up to match the top seed.)

### Example E — power of two, N = 8
`S = 8`, `B = 0`. No byes exist in any category; Phase 1 returns all zeros and every team plays round 1. Only Phase 2 (matchup variety) does any work.

---

## 7. Limitations

- **Only round 1 is optimized for variety.** In single elimination, round-2+ opponents depend on results, so the generator cannot guarantee distinct opponents beyond the first round. The metric `met[][]` tracks round-1 pairings only.
- **The bye budget is a preference, not a guarantee.** Because the true bye count is fixed at `A = C·B`, the literal "4 / 3 / 2 / 1" rule is satisfied only when supply matches demand. The reconciliation rules (Section 3.2) define the documented behaviour when it does not — and that choice (deficit strips low seeds, surplus feeds high seeds) is the single place to change if a different fairness policy is ever desired.
- **Rematches can exceed the pigeonhole bound.** Perfect-matching constraints occasionally force one or two more repeats than `max(0, C·(N−S/2) − N(N−1)/2)`; the bound is a floor, not always achievable.

---

## 8. Complexity

For the small `N` (typically ≤ 16) and `C` (typically ≤ 8) of these events, all phases are negligible:

- Phase 1: `O(N + A)` ≈ `O(N·C)`.
- Phase 1b: `O(C · N log N)` (sort per category).
- Phase 2: per category, exact min-weight matching is `O(n³)` with `n = 2N − S`; greedy + 2-opt is `O(n²)` per local-search pass.
- Phase 3: reuses the existing `O(S)` bracket builder per category.

---

## 9. Code map

| Phase | Module | Key export |
|-------|--------|------------|
| 1, 1b | `lib/groups/byes.ts` | `planByeBudget`, `assignByeCategories` |
| 2 | `lib/groups/pairing.ts` | `planRoundOnePairs`, `planAllPairings` |
| 3 | `lib/groups/generate.ts` | `generateGroupCategoryBrackets` |
| 3 | `lib/bracket/generate.ts` | extended with `firstRoundPairingMode: "explicit"` + `firstRoundSlots` |
| wiring | `app/api/groups/[id]/start/route.ts` | calls `generateGroupCategoryBrackets` |

Implementation is tracked in `task.md` Phase 19 (tasks T139–T141; T142 is the related central "Up Next" panel).
