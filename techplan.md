# Tournament Builder — Technical Plan

This document resolves all algorithmic and design ambiguities not fully specified in plan.md. It is the authoritative reference for implementation decisions.

---

## 1. WB Round 1 Seeding Algorithm

Teams are shuffled randomly (Fisher-Yates) before bracket generation. Positions 1..N map to shuffled teams; positions N+1..B are bye slots. The pairing formula then assigns positions to match slots.

### Pairing Algorithm

```typescript
function generateSeedPositions(B: number): number[] {
  // Returns positions array of length B/2
  // positions[i] faces positions[B - 1 - i] in WB R1
  // (converted to 1-based: position p faces B + 1 - p)
  const positions = [1]
  let currentSize = 2
  while (positions.length < B / 2) {
    const expanded: number[] = []
    for (const p of positions) {
      expanded.push(p)
      expanded.push(currentSize + 1 - p)
    }
    positions.length = 0
    positions.push(...expanded)
    currentSize *= 2
  }
  return positions
}
// WB R1 match i: teamAtPosition(positions[i]) vs teamAtPosition(B + 1 - positions[i])
```

### Explicit Match Order (top to bottom in bracket)

| Bracket size | WB R1 match order (top → bottom) |
|---|---|
| B=4 | (1,4), (2,3) |
| B=8 | (1,8), (4,5), (2,7), (3,6) |
| B=16 | (1,16),(8,9),(4,13),(5,12),(2,15),(7,10),(3,14),(6,11) |

Winners of adjacent pairs meet in the next WB round (matches 1+2 → WB R2 match 1, etc.).

### Bye Assignment

- Positions > N are bye slots (no team assigned).
- `isBye = true` for any WB R1 match where one slot is a bye position.
- The real team in that match auto-advances; no scores needed.

---

## 2. LB Structure (Explicit by Team Count)

### LB Round Types

- **Feed-in round**: WB losers enter LB. Each LB winner from prior round faces a WB loser (reverse-order cross-match to minimize rematches).
- **Pure LB round**: LB survivors face each other. No WB input.

Feed-in rounds and pure LB rounds alternate. The first LB round is always a feed-in (WB R1 losers).

### Feed-in Pairing Rule

When WB losers [WL1, WL2, ..., WLk] enter an LB feed-in round against LB winners [LW1, LW2, ..., LWk]:
- Match pairs: (WLk vs LW1), (WL(k-1) vs LW2), ... (reverse WB loser order vs forward LB winner order)
- Purpose: minimises chance of immediate rematches between teams from the same WB bracket half.

### 4-Team Bracket

| Round | Type | Matches | Input |
|---|---|---|---|
| LB R1 (LB Final) | Feed-in | 1 match | WB R1 loser 1 vs WB R1 loser 2 |

- `isLBFinal = true` on this match.
- LB Final winner = 3rd, loser = 4th.

### 8-Team Bracket

| LB Round | Type | Matches | Input | Losers Eliminated |
|---|---|---|---|---|
| LB R1 | Feed-in | 2 | WB R1 losers (4 teams): (L1 vs L4), (L2 vs L3) | 2 teams → 7th–8th |
| LB R2 | Feed-in | 2 | WB R2 losers (2) vs LB R1 winners (2): (WBL2 vs LBW1), (WBL1 vs LBW2) | 2 teams → 5th–6th |
| LB Final | Pure | 1 | LB R2 winners | 1 team → 4th |

- Bracket size: LB R1 has 2 matches (4 teams → 2 eliminated + 2 winners).
- LB R2 is a feed-in: 2 WB R2 losers enter against 2 LB R1 winners.
- Cross-match in LB R2: WB R2 loser from match 2 plays LB R1 winner from match 1 (reversed).

### 16-Team Bracket

| LB Round | Type | Matches | Input | Losers Eliminated |
|---|---|---|---|---|
| LB R1 | Feed-in | 4 | WB R1 losers (8 teams), cross-paired | 4 → 13th–16th |
| LB R2 | Feed-in | 4 | 4 WB R2 losers vs 4 LB R1 winners (reversed) | 4 → 9th–12th |
| LB R3 | Pure | 2 | 4 LB R2 winners | 2 → 7th–8th |
| LB R4 | Feed-in | 2 | 2 WB SF losers vs 2 LB R3 winners (reversed) | 2 → 5th–6th |
| LB Final | Pure | 1 | LB R4 winners | 1 → 4th |

### LB Cross-Pairing for WB R1 Losers (Feed-in Round 1)

WB R1 match indices are 1..B/2. Losers are paired cross-bracket:
- Loser of WB match 1 vs Loser of WB match B/2
- Loser of WB match 2 vs Loser of WB match B/2 - 1
- ...

For B=8: (L1 vs L4), (L2 vs L3). This keeps teams from the same WB quarter on opposite sides of the LB.

### Lucky Loser Bye Propagation

WB R1 match i has a bye → no loser is produced. The corresponding LB R1 slot (the slot that would have received that loser) becomes a bye. The team that would have faced this non-existent loser automatically advances.

Mapping: LB R1 match j receives losers from WB R1 match j*2-1 and WB R1 match j*2 (approximately, depending on pairing). Specifically:
- LB R1 match k, slot A ← loser of WB R1 match `seededPosition[k*2 - 2]`
- LB R1 match k, slot B ← loser of WB R1 match `seededPosition[k*2 - 1]`
- If either WB R1 match was a bye → the corresponding LB R1 slot is a bye too → `isBye = true` on the LB R1 match if both inputs are byes, or one slot auto-fills if only one input was a real loser.

Edge case — all LB R1 inputs are byes (e.g. 3-team bracket padded to 4): the LB R1 match has 1 real team vs 1 bye slot → `isBye = true` → that team auto-advances as LB champion (3rd place). No LB Final is played.

### Match Count Formula

| Teams (power of 2, N) | WB Matches | LB Matches | Total |
|---|---|---|---|
| 4 | 3 | 1 | 4 |
| 8 | 7 | 5 | 12 |
| 16 | 15 | 13 | 28 |
| N | N-1 | N-3 | 2N-4 |

Non-power-of-2: use bracket size B (next power of 2), but bye matches are stored separately (`isBye=true`) and do not affect play.

---

## 3. State Machines

### Match Status

```
pending  ──(both team slots filled)──► ready
ready    ──(admin: mark in_progress)──► in_progress  [court assigned]
in_progress ──(admin: confirm)────────► completed    [court freed]

Bye matches: generated directly as completed (skips pending/ready/in_progress)
No reverse transitions are allowed.
Confirmed matches are immutable (no reset in v1).
```

Transitions enforced server-side:
- `pending → ready`: triggered by `onMatchComplete` when it fills the last team slot
- `ready → in_progress`: triggered by `PUT /status { status: 'in_progress' }`, requires court available
- `in_progress → completed`: triggered by `PUT /status { status: 'completed' }`, requires winner determinable from sets

### Tournament Status

```
draft ──(admin: start tournament)──► active
active ──(all non-bye matches completed)──► completed

draft: can be deleted
active/completed: cannot be deleted
No reverse transitions.
```

Deletion is a hard delete (no soft-delete flag needed in v1).

---

## 4. API Response Shapes (Complete)

All endpoints return JSON. All errors use:
```ts
{ error: string, code: 'UNAUTHORIZED' | 'NOT_FOUND' | 'VALIDATION_ERROR' | 'CONFLICT' | 'INTERNAL_ERROR' }
```

### GET /api/tournaments
```ts
// Response 200
{
  tournaments: Array<{
    _id: string
    name: string
    status: 'draft' | 'active' | 'completed'
    createdAt: string   // ISO 8601
    teamCount: number
    matchCount: number  // non-bye matches only
  }>
}
```
No pagination in v1 (tournaments list is small).

### POST /api/tournaments
```ts
// Request
{ name: string, teamSize: 2|3|4, courtsAvailable: number, inputMode: 'teams'|'players' }
// Response 201
{ _id: string, name: string, status: 'draft', teamSize: number, courtsAvailable: number }
```

### GET /api/tournaments/[id]
```ts
// Response 200 — full tournament including all matches (used by bracket view and admin)
{
  _id: string
  name: string
  status: 'draft' | 'active' | 'completed'
  teamSize: number
  courtsAvailable: number
  currentMatchIds: string[]
  createdAt: string
  teams: Array<{
    _id: string
    name: string
    players: string[]
    seed: number
  }>
  matches: Array<{
    _id: string
    bracket: 'winner' | 'loser'
    round: number
    position: number
    label: string
    placeRange: string
    format: 'bo1' | 'bo3'
    status: 'pending' | 'ready' | 'in_progress' | 'completed'
    isBye: boolean
    isWBFinal: boolean
    isLBFinal: boolean
    courtNumber: number | null
    winnerId: string | null
    loserId: string | null
    teamA: { teamId: string, sets: SetScore[] } | null
    teamB: { teamId: string, sets: SetScore[] } | null
    winnerNextMatchId: string | null
    loserNextMatchId: string | null
  }>
}
```

### DELETE /api/tournaments/[id]
- Only allowed when `status === 'draft'`. Otherwise returns 409 CONFLICT.
- Response 204 no body.

### POST /api/tournaments/[id]/start
```ts
// Request body: none
// Response 200
{ tournamentId: string, matchesGenerated: number, byeCount: number }
// Errors: 409 if tournament is not draft; 422 VALIDATION_ERROR if < 2 teams
```

### PUT /api/tournaments/[id]/matches/[matchId]/scores
```ts
// Request
{ setIndex: number, scoreA: number, scoreB: number }

// Validation:
// - setIndex 0-indexed; must be 0 for BO1, 0–2 for BO3
// - setIndex must be <= sets.length (cannot skip a set)
//   Exception: setIndex < sets.length is a re-entry (overwrites)
// - Re-entering setIndex N clears all sets with index > N
// - Calls validateSet(scoreA, scoreB)

// Response 200
{
  setIndex: number
  pointsToWin: 11 | 21
  setWinner: 'A' | 'B'
  sets: SetScore[]          // full updated sets array
  matchWinner: 'A' | 'B' | null   // null = match still ongoing
  clearedSets: number       // how many subsequent sets were cleared (0 if re-entry didn't occur or no sets followed)
}
```

### PUT /api/tournaments/[id]/matches/[matchId]/status
```ts
// Request
{ status: 'in_progress' | 'completed' }

// For in_progress:
//   - match.status must be 'ready'
//   - currentMatchIds.length < courtsAvailable
//   - assigns lowest unused court number (1..courtsAvailable)

// For completed:
//   - match.status must be 'in_progress'
//   - determineMatchWinner(sets, format) must return 'A' or 'B' (not null)
//   - triggers onMatchComplete()

// Response 200
{
  matchId: string
  status: 'in_progress' | 'completed'
  courtNumber: number | null          // assigned court (in_progress) or null (completed)
  winnerId: string | null             // populated on completed
  loserId: string | null
  tournamentCompleted: boolean        // true if this match triggered tournament completion
  nextMatchesReady: string[]          // IDs of matches that became 'ready' due to this completion
}
```

---

## 5. Set Re-entry Behaviour

When `setIndex` in the scores endpoint refers to an already-recorded set:

```
Re-entry: setIndex < current sets.length

1. Overwrite sets[setIndex] with new scores.
2. Splice off all sets with index > setIndex (clear subsequent sets).
3. Match stays in_progress (no status change).
4. Response includes clearedSets count.

Example:
  sets = [A:11-9, B:11-8, A:15-13]  (A won 2-1)
  Re-enter setIndex=0 with B:11-9
  → sets = [B:11-9]  (sets 1 and 2 cleared)
  → matchWinner = null (only 1 set recorded, no winner yet)
  → clearedSets = 2
```

---

## 6. Score Validation Edge Cases

All handled by `validateSet`:

| Input | Behaviour |
|---|---|
| Non-integer scores (11.5, "abc") | VALIDATION_ERROR |
| Negative score | VALIDATION_ERROR |
| Both scores 0 | VALIDATION_ERROR (tied) |
| Winner < 11 (9:7) | VALIDATION_ERROR (too low) |
| 1-point lead (11:10, 21:20) | VALIDATION_ERROR |
| 22:20 | Accepted as 21-pt game (max(22,20)=22 ≥ 21). Edge case acknowledged. |
| Very large score (1000000:999998) | Valid — no upper cap. Diff=2, winner ≥ 21. |

---

## 7. Up Next Banner

Displayed on both public bracket view and admin manage page.

```
Matches to show = tournament.matches
  .filter(m => m.status === 'ready' && !m.isBye)
  .sort((a, b) => {
    // WB before LB
    if (a.bracket !== b.bracket) return a.bracket === 'winner' ? -1 : 1
    // Earlier round first
    return a.round - b.round || a.position - b.position
  })
  .slice(0, 3)  // show at most 3
```

If empty: banner is hidden entirely (no "No matches ready" placeholder).

---

## 8. SWR Polling

- Polls `GET /api/tournaments/[id]` every 5 seconds.
- Stop condition: `tournament.status === 'completed'` → call `mutate(undefined, false)` to stop revalidation.
- Error handling: SWR default exponential backoff. On repeated failure (3+ consecutive errors), show a non-blocking "Unable to refresh" banner. Dismiss when next successful fetch.
- No `If-Modified-Since` or ETag needed in v1.

---

## 9. Bye Match Rendering

Bye matches are stored but displayed with special treatment:

| Location | Behaviour |
|---|---|
| Bracket grid (public + admin) | Shown as a completed match tile. Team A shows the real team name; Team B shows "—" (dash). No scores displayed. |
| MatchCard status | Always shows "completed" styling (no LIVE badge, no court number). |
| Admin match list | Hidden from action list ("Mark In Progress", "Enter Scores" never shown). |
| "Up Next" banner | Excluded. |

---

## 10. Court Badge Layout

- Badge appears only when `status === 'in_progress'`. No reserved space when hidden.
- Position: absolute top-right of MatchCard. Styled as a small pill (e.g. "Court 2").
- On mobile, badge stacks below the label row if the card is narrow (<240px).
- Layout shift is acceptable since court assignment is an admin action unlikely to be observed mid-render by spectators.

---

## 11. Error Display Strategy (Admin UI)

| Error type | Display mechanism |
|---|---|
| Score validation (bad input) | Inline red text below the score input field |
| Network/API failure (500, timeout) | Toast notification, bottom-right, auto-dismiss 5s |
| Conflict (courts full, wrong status) | Toast notification with specific message |
| Auth error (session expired) | Redirect to `/admin/login` with query `?reason=session_expired` |
| Form validation (empty name, etc.) | Inline red text below the field |

---

## 12. 2-Team and 3-Team Edge Cases

### 2 Teams

- Bracket size B=2. Single WB match, `isWBFinal=true`, format=BO3.
- No LB generated. `matches.filter(m => m.bracket === 'loser')` is empty.
- Tournament completion: WB Final confirmed → tournament completed.
- Standings: 1st and 2nd only. LB section hidden in bracket view.

### 3 Teams

- Padded to B=4. One team gets a bye in WB R1 (Lucky Winner).
- LB R1: 1 LB match, but only 1 real team enters (the WB R1 loser). The other LB R1 slot is a bye (Lucky Loser, since the bye WB match produced no loser). The LB R1 match is `isBye=true`. The real team auto-advances as LB champion.
- `isLBFinal=true` on the LB R1 match (it is the only LB match).
- 3rd place: LB champion (auto-advanced). 4th place: no one (only 3 teams).
- `placeRange` for the LB match: "3rd Place".

---

## 13. Place Range Algorithm

At bracket generation time, compute `placeRange` for each match based on bracket size B and match position.

```typescript
function computePlaceRange(match: MatchDraft, B: number): string {
  if (match.isWBFinal) return '1st–2nd Place'
  if (match.isLBFinal) return '3rd–4th Place'  // (or "3rd Place" for 3-team)

  if (match.bracket === 'winner') {
    // WB losses route to LB, so no final place determined here
    return ''
  }

  // LB elimination rounds: teams losing here are done
  // placeRange = (teamsStillIn + 1) to (teamsStillIn + eliminatedCount)
  // teamsStillIn = matches remaining after this round * 2
  // Compute at generation time per round
  return computeLBEliminationRange(match.round, B)
}
```

LB elimination ranges for real team counts (not padded):
| LB Round | 8-team | 16-team |
|---|---|---|
| LB R1 | 7th–8th | 13th–16th |
| LB R2 | 5th–6th | 9th–12th |
| LB R3 | — | 7th–8th |
| LB R4 | — | 5th–6th |

For non-power-of-2 team counts: base the range on actual team count, not padded. E.g. 6 teams padded to 8: treat as 6-team for place range computation.

---

## 14. Test Fixtures and Helpers

All test files import from `__tests__/setup/db.ts`. Common factory functions should live in `__tests__/helpers/`:

```typescript
// __tests__/helpers/factories.ts

function makeTeams(n: number): Team[]  // generates n teams with names Team A..Z

function makeTournament(overrides?: Partial<Tournament>): Tournament  // sensible defaults

function makeMatch(overrides?: Partial<Match>): Match  // pending match, BO1, WB R1

function makeSet(scoreA: number, scoreB: number): SetScore  // auto-detects pointsToWin
```

API tests use `createMocks` from `node-mocks-http` or equivalent to test route handlers directly without spinning up a server.

---

## 15. Minimum Tournament Requirements

| Constraint | Value | Where enforced |
|---|---|---|
| Minimum teams | 2 | `POST /start` server-side validation |
| Minimum courts | 1 | `POST /tournaments` and `PUT /tournaments/[id]` |
| Maximum courts | 10 | Same |
| Minimum players per team | 2 (for player auto-assign) | `POST /start` if playerMode |
| Team name max length | 50 chars | Model validation |
| Tournament name max length | 100 chars | Model validation |
| Score values | 0..999 (integers) | `validateSet` |
