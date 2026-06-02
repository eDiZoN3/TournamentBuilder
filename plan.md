# Tournament Builder — Comprehensive Development Plan

## Overview

A web application for running **volleyball tournaments with a consolation bracket**. An admin creates tournaments, assigns players to teams, enters match scores, and assigns matches to courts. The bracket updates automatically in real time and is publicly viewable.

**Bracket structure**: The Winner Bracket (WB) determines 1st and 2nd place. The Loser Bracket (LB) is a consolation bracket — teams that lose in the WB keep playing, but cannot win 1st or 2nd place. The LB Final determines 3rd and 4th place (and further placements for larger brackets). There is no crossover Grand Final between WB and LB champions.

**Courts**: The tournament has a configurable number of simultaneous courts. Up to `courtsAvailable` matches can be in progress at once. Each in-progress match shows its assigned court number.

**Scoring**: First to reach 11 or 21 points *with a 2-point lead*. No hard cap. Auto-detected from the scores entered.

**Format**: WB Semi-Final and WB Final are Best-of-3. LB Final is Best-of-3. All other matches are Best-of-1.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14+ (App Router) | SSR + API routes in one project |
| Language | TypeScript | Type safety for bracket logic |
| Database | MongoDB via Mongoose | Flexible schema for bracket structures |
| Auth | NextAuth.js (Credentials provider) | Simple admin-only login |
| Styling | Tailwind CSS | Responsive utility-first styling |
| State | React Context + SWR | Real-time polling for live bracket updates |
| Test runner | Vitest | Fast, native ESM, same API as Jest |
| Test DB | mongodb-memory-server | In-memory MongoDB for unit/integration tests |
| Component tests | React Testing Library | DOM-level component assertions |
| Deployment | Vercel + MongoDB Atlas | Standard Next.js hosting |

---

## Data Models

### User (Admin)

```ts
{
  _id: ObjectId,
  email: string,
  passwordHash: string,   // bcrypt
  role: 'admin'
}
```

Only one admin account is needed. Seed it via an init script.

---

### Tournament

```ts
{
  _id: ObjectId,
  name: string,
  status: 'draft' | 'active' | 'completed',
  teamSize: 2 | 3 | 4,             // players per team
  courtsAvailable: number,          // how many courts can run simultaneously (>= 1)
  createdAt: Date,
  teams: Team[],                    // embedded
  matches: Match[],                 // embedded
  currentMatchIds: ObjectId[]       // all matches currently in_progress
}
```

---

### Team

```ts
{
  _id: ObjectId,
  name: string,
  players: string[],    // player names
  seed: number          // assigned randomly at tournament start (shuffle order)
}
```

---

### Match

```ts
{
  _id: ObjectId,
  bracket: 'winner' | 'loser',
  round: number,                    // 1-based within each bracket
  position: number,                 // 1-based within the round
  label: string,                    // e.g. "WB Final", "LB Final", "Round 1"
  placeRange: string,               // e.g. "1st–2nd Place", "3rd–4th Place"
  format: 'bo1' | 'bo3',
  teamA: TeamSlot | null,
  teamB: TeamSlot | null,
  status: 'pending' | 'ready' | 'in_progress' | 'completed',
  winnerId: ObjectId | null,
  loserId: ObjectId | null,
  winnerNextMatchId: ObjectId | null,
  winnerNextSlot: 'A' | 'B' | null,
  loserNextMatchId: ObjectId | null,   // null if WB Final loser (2nd place) or LB Final loser (4th place)
  loserNextSlot: 'A' | 'B' | null,
  isBye: boolean,                   // true when a team advances without playing
  isWBFinal: boolean,               // true for the last WB match (winner=1st, loser=2nd)
  isLBFinal: boolean,               // true for the last LB match (winner=3rd, loser=4th)
  courtNumber: number | null        // assigned when match becomes in_progress
}
```

```ts
// TeamSlot — embedded in Match.teamA / Match.teamB
{
  teamId: ObjectId,
  sets: SetScore[]    // up to 3 sets for BO3, 1 set for BO1
}

// SetScore
{
  scoreA: number,
  scoreB: number,
  pointsToWin: 11 | 21    // auto-detected when set is saved
}
```

---

## Application Architecture

```
/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                  # Tournament list
│   │   └── tournament/[id]/
│   │       └── page.tsx              # Public bracket view
│   ├── admin/
│   │   ├── login/page.tsx
│   │   ├── dashboard/page.tsx        # List + create tournaments
│   │   ├── tournament/
│   │   │   ├── new/page.tsx          # Create tournament form
│   │   │   └── [id]/
│   │   │       ├── setup/page.tsx    # Enter teams/players
│   │   │       └── manage/page.tsx   # Enter match scores
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── tournaments/
│       │   ├── route.ts              # GET list, POST create
│       │   └── [id]/
│       │       ├── route.ts          # GET, PUT, DELETE
│       │       ├── start/route.ts    # POST — generate bracket
│       │       └── matches/
│       │           └── [matchId]/
│       │               ├── route.ts          # GET match detail
│       │               ├── scores/route.ts   # PUT — submit/update a set score
│       │               └── status/route.ts   # PUT — set in_progress / completed
├── lib/
│   ├── db.ts                         # Mongoose connection
│   ├── bracket/
│   │   ├── generate.ts               # Bracket generation logic
│   │   ├── advance.ts                # Win/loss routing logic
│   │   └── labels.ts                 # Round labels, place strings
│   ├── scoring.ts                    # Set validation, win detection
│   └── models/
│       ├── Tournament.ts
│       └── User.ts
├── components/
│   ├── bracket/
│   │   ├── BracketView.tsx           # Full bracket canvas
│   │   ├── WinnerBracket.tsx
│   │   ├── LoserBracket.tsx
│   │   └── MatchCard.tsx             # Individual match tile
│   ├── admin/
│   │   ├── ScoreEntry.tsx            # Score input form
│   │   └── MatchControls.tsx
│   └── ui/
│       └── (shared primitives)
├── __tests__/
│   ├── setup/
│   │   └── db.ts                     # mongodb-memory-server setup/teardown
│   ├── lib/
│   │   ├── scoring.test.ts
│   │   └── bracket/
│   │       ├── generate.test.ts
│   │       ├── advance.test.ts
│   │       └── labels.test.ts
│   ├── api/
│   │   ├── tournaments.test.ts
│   │   ├── start.test.ts
│   │   ├── scores.test.ts
│   │   └── status.test.ts
│   └── components/
│       ├── MatchCard.test.tsx
│       └── ScoreEntry.test.tsx
```

---

## Pages & Routes

### Public

#### `/` — Tournament List
- Shows all tournaments with status badges (Draft / Active / Completed)
- Links to the bracket view for each tournament
- No login required

#### `/tournament/[id]` — Bracket View
- Full bracket rendered visually (winner and loser brackets)
- Live polling via SWR every 5 seconds
- In-progress matches highlighted with a pulsing border and court number badge (e.g. "Court 2")
- Completed matches show the winner's name and set scores
- "Up Next" banner showing the first `ready` match(es)
- Toggle between Winner Bracket and Loser Bracket on mobile (tabs), side by side on desktop

---

### Admin

#### `/admin/login`
- Email + password form
- On success: redirect to `/admin/dashboard`

#### `/admin/dashboard`
- List all tournaments with status
- Button: "Create New Tournament"
- Actions per tournament: Setup | Manage | View | Delete (only if Draft)

#### `/admin/tournament/new`
- Form fields:
  - Tournament name (text)
  - Team size: 2 / 3 / 4 (radio/select)
  - Number of courts: integer input (min 1, max 10)
  - Input mode: "Enter team names" or "Enter player names (auto-assign)"
- On submit: create tournament with status `draft`, redirect to `/admin/tournament/[id]/setup`

#### `/admin/tournament/[id]/setup`
- **Team mode**: List of team name inputs. Add/remove rows dynamically.
- **Player mode**: List of player name inputs. System will randomly group them into teams of the chosen size. Leftover players (if any) get appended to the last team (team becomes size+1).
- Warning shown if player count is not evenly divisible by team size
- Button: "Generate Teams" (player mode) — shows preview of auto-assigned teams with shuffle option
- Button: "Start Tournament" — validates at least 2 teams, generates bracket, sets status to `active`, redirects to `/admin/tournament/[id]/manage`

#### `/admin/tournament/[id]/manage`
- Full bracket view (same as public) plus admin controls
- Each `ready` or `in_progress` match card has admin actions
- **"Mark as In Progress"** button: assigns next available court number (1..courtsAvailable), sets status to `in_progress`. Disabled if all courts occupied.
- **"Enter Scores"** button: opens score entry modal
  - For BO1: single score row (Team A | Team B), editable until match is confirmed
  - For BO3: up to 3 sets shown. Next set unlocks once previous has a valid score. Any set can be re-entered at any time while match is in_progress.
  - Computed winner shown once enough sets are done
  - **"Confirm Match"** button: validates winner is determined, marks match complete, advances teams, frees court
- Tournament completion is automatic when all non-bye matches are completed

---

## API Design

### Auth

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/[...nextauth]` | NextAuth credentials login/logout |

---

### Tournaments

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/tournaments` | Public | List all tournaments (name, status, createdAt) |
| POST | `/api/tournaments` | Admin | Create tournament (name, teamSize, courtsAvailable, inputMode) |
| GET | `/api/tournaments/[id]` | Public | Full tournament data including all matches |
| PUT | `/api/tournaments/[id]` | Admin | Update name / status |
| DELETE | `/api/tournaments/[id]` | Admin | Delete (only if draft) |
| POST | `/api/tournaments/[id]/start` | Admin | Finalize teams, generate full bracket |

---

### Matches

| Method | Route | Auth | Description |
|---|---|---|---|
| PUT | `/api/tournaments/[id]/matches/[matchId]/status` | Admin | Set match status |
| PUT | `/api/tournaments/[id]/matches/[matchId]/scores` | Admin | Submit or update a set score |

**Status endpoint** accepts `{ status: 'in_progress' | 'completed' }`:
- `in_progress`: checks that `currentMatchIds.length < courtsAvailable`; assigns lowest unused court number (1..courtsAvailable); adds matchId to `currentMatchIds`
- `completed`: validates that a winner is determinable from current set scores; routes winner and loser; removes matchId from `currentMatchIds`; clears `courtNumber`; checks tournament completion

**Scores endpoint** accepts `{ setIndex: number, scoreA: number, scoreB: number }`:
- Validates `setIndex` is within allowed range (0–2 for BO3, 0 only for BO1)
- Validates `setIndex <= sets already recorded` (cannot skip a set)
- Runs `validateSet(scoreA, scoreB)` — see Business Logic §4
- Overwrites or appends the set at `setIndex`
- Does NOT automatically complete the match — admin must call the status endpoint with `completed`
- Returns `{ setIndex, pointsToWin, setWinner, matchWinner: 'A' | 'B' | null }`

**Error envelope** (all API errors):
```ts
{ error: string, code: string }
// codes: UNAUTHORIZED, NOT_FOUND, VALIDATION_ERROR, CONFLICT, INTERNAL_ERROR
```

---

## Business Logic

### 1. Team Auto-Assignment (Player Mode)

```
1. Shuffle player list (Fisher-Yates)
2. Split into chunks of teamSize
3. If remainder exists: append extra players to last team (team becomes size+1)
4. Generate team names: "Team A", "Team B", ... (admin can rename before starting)
```

---

### 2. Bracket Generation

Called when admin clicks "Start Tournament".

```
1. Shuffle teams array (Fisher-Yates) → this is the random seeding order
2. Pad to next power of 2 (bracket size B): positions beyond team count are "bye" slots
3. Build WB Round 1 using standard seeding pairs against the padded bracket:
     Position 1 vs B, Position 2 vs B-1, ... (positions paired so top half faces bottom half)
     Standard 8-slot pairing: 1v8, 4v5, 3v6, 2v7 (anti-seeded order for balanced bracket)
   Any match where one slot is a bye slot → isBye=true, winner=present team, set immediately
4. Build remaining WB rounds: each round's matches pair winners of adjacent prior-round matches
5. Build LB:
   LB Round 1: pairs losers from WB Round 1
     Pairing: loser of WB match 1 vs loser of WB match (B/2),
              loser of WB match 2 vs loser of WB match (B/2 - 1), etc.
     (Cross-seeded so that same bracket halves meet late, not early)
     If a WB R1 match was a bye → no loser produced → corresponding LB R1 slot is also a bye
       ("Lucky Loser": the team they would have faced gets a free pass in LB R1)
   Alternating rounds thereafter:
     Feed-in rounds: LB winners face that round's WB losers (one LB winner per WB loser, cross-matched)
     Pure LB rounds: LB winners face each other
   Continue until 1 LB match remains (LB Final)
6. Mark the last WB match as isWBFinal=true
   Mark the last LB match as isLBFinal=true
   WB Final loser has loserNextMatchId=null (they get 2nd place, do not continue)
   LB Final loser has loserNextMatchId=null (they get 4th place, eliminated)
7. Assign format (bo3 or bo1) to each match (see §2a below)
8. Assign labels and place strings (see §3)
9. Pre-wire all winnerNextMatchId / winnerNextSlot / loserNextMatchId / loserNextSlot
10. Process all bye matches: call advance() immediately for each isBye match
11. Save all matches to tournament document; set tournament.status = 'active'
```

#### 2a. BO3 Format Assignment

```
For a WB match:
  totalWBRounds = log2(B)   // B = bracket size (power of 2)
  if match.round >= totalWBRounds - 1:   // last 2 WB rounds
    format = 'bo3'
  else:
    format = 'bo1'

For an LB match:
  if match.isLBFinal:
    format = 'bo3'
  else:
    format = 'bo1'
```

Examples:
- 4 teams (B=4, totalWBRounds=2): WB R1 (round=1, >= 1 → BO3), WB Final (round=2 → BO3). LB Final → BO3. All matches are BO3.
- 8 teams (B=8, totalWBRounds=3): WB R1 (round=1 < 2 → BO1), WB SF (round=2 >= 2 → BO3), WB Final (round=3 → BO3). LB Final → BO3.
- 16 teams (B=16, totalWBRounds=4): WB R1, R2 → BO1; WB SF, WB Final → BO3. LB Final → BO3.

#### 2b. Match Counts (no crossover Grand Final)

| Teams | WB Matches | LB Matches | Total |
|---|---|---|---|
| 4 | 3 | 1 | 4 |
| 8 | 7 | 5 | 12 |
| 16 | 15 | 13 | 28 |
| N (power of 2) | N-1 | N-3 | 2N-4 |

Non-power-of-2 team counts are padded with bye slots to the next power of 2.

---

### 3. Match Labels & Place Strings

Assigned at bracket generation time based on match position and round.

**Winner Bracket:**

| Condition | label | placeRange |
|---|---|---|
| isWBFinal | "WB Final" | "1st–2nd Place" |
| round == totalWBRounds - 1 | "WB Semi-Final" | "Top 4" |
| round == totalWBRounds - 2 | "WB Quarter-Final" | "Top 8" |
| round < totalWBRounds - 2 | "WB Round {round}" | "" |

**Loser Bracket:**

| Condition | label | placeRange |
|---|---|---|
| isLBFinal | "LB Final" | "3rd–4th Place" |
| second-to-last LB round | "LB Semi-Final" | "Top 6" (8-team) |
| earlier LB rounds | "LB Round {round}" | "" |

**Place string for LB elimination rounds**: derived from how many teams are eliminated at that round. For a fully specified system, assign placeRange at generation time based on bracket size. Example for 8 teams:
- LB R1 losers: "7th–8th Place"
- LB R2 losers: "5th–6th Place"
- LB Final loser: "4th Place"

---

### 4. Scoring & Win Detection

This section is the source of truth for all scoring logic. All test cases are derived from these rules.

#### 4a. Set Validation

```typescript
interface SetValidation {
  valid: boolean
  pointsToWin?: 11 | 21
  error?: string
}

function validateSet(scoreA: number, scoreB: number): SetValidation {
  if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB))
    return { valid: false, error: 'Scores must be integers' }
  if (scoreA < 0 || scoreB < 0)
    return { valid: false, error: 'Scores must be non-negative' }
  if (scoreA === scoreB)
    return { valid: false, error: 'Scores cannot be tied' }

  const winner = Math.max(scoreA, scoreB)
  const loser = Math.min(scoreA, scoreB)
  const diff = winner - loser

  // Deuce rule: winner must lead by exactly 2 or more
  if (diff < 2)
    return { valid: false, error: 'Winner must lead by at least 2 points' }

  // Auto-detect which game type was played
  if (winner >= 21) return { valid: true, pointsToWin: 21 }
  if (winner >= 11) return { valid: true, pointsToWin: 11 }

  return { valid: false, error: 'Score too low — minimum winning score is 11' }
}
```

**Complete truth table (must be covered by tests):**

| scoreA | scoreB | valid | pointsToWin | reason |
|---|---|---|---|---|
| 11 | 9 | ✓ | 11 | standard 11-pt win |
| 15 | 13 | ✓ | 11 | 11-pt deuce win |
| 12 | 10 | ✓ | 11 | 11-pt deuce win |
| 20 | 18 | ✓ | 11 | long 11-pt deuce game |
| 21 | 19 | ✓ | 21 | standard 21-pt win |
| 23 | 21 | ✓ | 21 | 21-pt deuce win |
| 25 | 23 | ✓ | 21 | 21-pt extended deuce |
| 11 | 10 | ✗ | — | 1-pt lead insufficient |
| 21 | 20 | ✗ | — | 1-pt lead insufficient |
| 11 | 11 | ✗ | — | tied |
| 10 | 8 | ✗ | — | winner < 11 |
| 0 | 0 | ✗ | — | tied |
| -1 | 11 | ✗ | — | negative score |
| 9 | 7 | ✗ | — | winner < 11 |
| 22 | 20 | ✓ | 21 | classified as 21-pt (edge, won't occur in practice) |

#### 4b. Set Winner

```typescript
function determineSetWinner(scoreA: number, scoreB: number): 'A' | 'B' {
  return scoreA > scoreB ? 'A' : 'B'
}
```

#### 4c. Match Winner

```typescript
function determineMatchWinner(
  sets: SetScore[],
  format: 'bo1' | 'bo3'
): 'A' | 'B' | null {
  const winsA = sets.filter(s => s.scoreA > s.scoreB).length
  const winsB = sets.filter(s => s.scoreB > s.scoreA).length

  if (format === 'bo1') {
    return sets.length === 1 ? (sets[0].scoreA > sets[0].scoreB ? 'A' : 'B') : null
  }

  // bo3
  if (winsA === 2) return 'A'
  if (winsB === 2) return 'B'
  return null
}
```

**BO3 match winner truth table (must be covered by tests):**

| Sets | winsA | winsB | result |
|---|---|---|---|
| [A wins, A wins] | 2 | 0 | 'A' (2-0) |
| [B wins, B wins] | 0 | 2 | 'B' (2-0) |
| [A wins, B wins, A wins] | 2 | 1 | 'A' (2-1) |
| [A wins, B wins, B wins] | 1 | 2 | 'B' (2-1) |
| [A wins] | 1 | 0 | null (still ongoing) |
| [A wins, B wins] | 1 | 1 | null (still ongoing) |
| [] | 0 | 0 | null |

---

### 5. Advancing Teams After a Match

Called when admin confirms a match (status endpoint with `completed`).

```
onMatchComplete(tournament, match):
  winner = determineMatchWinner(match.teamA.sets ++ match.teamB.sets combined, match.format)
  if winner == null → reject (cannot complete without a determined winner)

  winnerId = winner == 'A' ? match.teamA.teamId : match.teamB.teamId
  loserId  = winner == 'A' ? match.teamB.teamId : match.teamA.teamId

  match.winnerId = winnerId
  match.loserId  = loserId
  match.status   = 'completed'
  match.courtNumber = null

  // Advance winner to next match
  if match.winnerNextMatchId:
    nextMatch = find(match.winnerNextMatchId)
    nextMatch[winnerNextSlot].teamId = winnerId
    if nextMatch.teamA && nextMatch.teamB:
      nextMatch.status = 'ready'

  // Route loser
  if match.loserNextMatchId:
    nextMatch = find(match.loserNextMatchId)
    nextMatch[loserNextSlot].teamId = loserId
    if nextMatch.teamA && nextMatch.teamB:
      nextMatch.status = 'ready'
  // else: loser is eliminated (WB Final loser = 2nd place, LB Final loser = 4th place)

  // Update tournament
  tournament.currentMatchIds = remove(tournament.currentMatchIds, match._id)

  // Check tournament completion: all non-bye matches completed
  if tournament.matches.every(m => m.isBye || m.status == 'completed'):
    tournament.status = 'completed'

  save(tournament)
```

---

### 6. Courts & Match Scheduling

```
Assigning a court (status → 'in_progress'):
  occupied = tournament.matches.filter(m => m.status == 'in_progress').map(m => m.courtNumber)
  if occupied.length >= tournament.courtsAvailable:
    reject("No courts available")
  courtNumber = lowest integer in 1..courtsAvailable not in occupied
  match.courtNumber = courtNumber
  match.status = 'in_progress'
  tournament.currentMatchIds.push(match._id)

Freeing a court (status → 'completed'):
  match.courtNumber = null  // cleared in onMatchComplete

Invariant:
  At all times: tournament.matches.filter(m => m.status == 'in_progress').length
                <= tournament.courtsAvailable
```

---

### 7. Bye Handling

Byes are assigned randomly: teams are shuffled before placement into the bracket, so any team can receive a bye based on their shuffle position.

**Lucky Winner** (bye in WB Round 1):
- One slot of the match is empty (no opponent)
- `isBye = true`, winner set to the present team immediately during generation
- `advance()` called immediately — team moves to WB Round 2
- Match is never shown as `in_progress` and cannot receive scores

**Lucky Loser** (bye propagation in LB):
- When a WB R1 match is a bye, no loser is produced for LB R1
- The corresponding LB R1 slot that would have faced this non-existent loser is also a bye
- `isBye = true`, present team in that LB R1 slot advances to LB R2 automatically
- This prevents empty LB slots from blocking the bracket

Bye matches are filtered out of the admin match list and the "Up Next" banner.

---

## UI Components

### MatchCard

Displays a single match in the bracket grid.

```
┌─────────────────────────────────┐
│ WB Semi-Final · Top 4  [Crt 2]  │  ← label + placeRange + court badge
├───────────────┬─────────────────┤
│ Team Alpha    │  11   8         │  ← teamA name | set scores
│ Team Beta     │   8  11  12     │  ← teamB       (BO3: up to 3 cols)
├───────────────┴─────────────────┤
│ ● LIVE                          │  ← status indicator
└─────────────────────────────────┘
```

States:
- `pending` — greyed out, team slots show "TBD"
- `ready` — both teams known, neutral styling
- `in_progress` — highlighted border (pulsing gold/orange), "● LIVE" badge, court number badge top-right
- `completed` — winner row bold + green, loser row dim

For BO3: show set scores in up to 3 columns. Show only played sets (2 columns for 2-0, 3 for 2-1).

Court badge: "Court 1", "Court 2" etc. shown only when `status == 'in_progress'`.

---

### BracketView Layout

```
Desktop (≥1024px):
┌────────────────────────────────────────────────────────────────────┐
│  Winner Bracket                                          WB Final  │
│  R1  →  R2 (SF)  →  WB Final                                       │
│  [M1]   [M3]      [WBF]                                            │
│       ↘       ↘                                                    │
│  [M2]   [M4]                                                        │
│                                                                     │
│  Loser Bracket                                          LB Final   │
│  LR1  →  LR2  →  ...  →  LB Final                                  │
└────────────────────────────────────────────────────────────────────┘

Tablet (768–1023px):
  Horizontal scroll container, same layout scaled down

Mobile (<768px):
  Two tabs: "Winner Bracket" | "Loser Bracket"
  Each bracket: vertical list of rounds, matches stacked per round
```

SVG connector lines drawn between adjacent rounds. Grid-based layout: each column is a round, each cell is a match slot.

---

### Score Entry Modal (Admin)

```
┌─────────────────────────────────┐
│ Enter Score — WB Semi-Final     │
│ Best of 3 · Top 4 · Court 1     │
├─────────────────────────────────┤
│ Set 1                           │
│ Team Alpha:  [  11  ]           │
│ Team Beta:   [   8  ]           │
│              [Save Set 1]       │
├─────────────────────────────────┤
│ Set 2 (unlocks after Set 1)     │
│ ...                             │
├─────────────────────────────────┤
│ Winner: Team Alpha (2-0)        │
│                  [Confirm Match]│
└─────────────────────────────────┘
```

Rules:
- Any already-entered set can be re-entered at any time while match is `in_progress`
- Next set unlocks once all prior sets have valid scores saved
- BO1: shows one score row, then "Confirm Match" when scores are entered
- BO3: "Confirm Match" only appears when a match winner is determined (2 sets won)
- Validation error shown inline if scores fail `validateSet`
- Confirming calls the status endpoint with `{ status: 'completed' }`

---

## Responsive Design Breakpoints

| Breakpoint | Behavior |
|---|---|
| Mobile `< 640px` | Stacked layout, bracket tabs, match cards full-width |
| Tablet `640–1023px` | Side-by-side brackets in horizontal scroll container |
| Desktop `≥ 1024px` | Full bracket side by side with connecting lines |

Tailwind config: use standard `sm:`, `md:`, `lg:` prefixes. Bracket SVG viewBox scales with container.

---

## Test Strategy

### Framework Setup

```
vitest.config.ts        — Vitest configuration, test globals, coverage
__tests__/setup/db.ts   — mongodb-memory-server start/stop, mongoose connect/disconnect
```

`vitest.config.ts` minimal config:
```ts
import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['__tests__/setup/db.ts'],
    coverage: { provider: 'v8', reporter: ['text', 'html'] }
  }
})
```

`__tests__/setup/db.ts` pattern:
```ts
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

let mongo: MongoMemoryServer
beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())
})
afterEach(async () => {
  await mongoose.connection.dropDatabase()
})
afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})
```

### Test File Responsibilities

| File | What it tests |
|---|---|
| `lib/scoring.test.ts` | `validateSet` full truth table, `determineMatchWinner` BO1+BO3 cases |
| `lib/bracket/generate.test.ts` | Match count, connections, bye propagation, format assignment, label correctness for 4/8/16 teams |
| `lib/bracket/advance.test.ts` | Winner routed to correct next match slot, loser routed correctly, WB Final/LB Final termination, court release |
| `lib/bracket/labels.test.ts` | Labels and placeRange for all match types and bracket sizes |
| `api/tournaments.test.ts` | Create, list, get, delete; auth guards; error codes |
| `api/start.test.ts` | Full bracket generated correctly via API; 4-team, 8-team, non-power-of-2 |
| `api/scores.test.ts` | Valid scores accepted, invalid rejected with correct error codes; set overwrite; setIndex boundary checks |
| `api/status.test.ts` | Court assignment; concurrent match limit; confirm with/without winner determined; tournament completion trigger |
| `components/MatchCard.test.tsx` | Renders all 4 status states; court badge visible/hidden; BO3 set columns |
| `components/ScoreEntry.test.tsx` | Set locking/unlocking; confirm button gating; inline validation error |

### Coverage Target

All files in `lib/` must have ≥ 90% line coverage. API route handlers: ≥ 80%. Components: ≥ 70%. Run `vitest run --coverage` to verify before any commit to main.

---

## Implementation Phases

### Phase 0 — Test Infrastructure
1. Install Vitest, `@vitest/coverage-v8`, `mongodb-memory-server`, `@testing-library/react`
2. `vitest.config.ts` and `__tests__/setup/db.ts`
3. Empty test stubs for all files in the test file list above
4. Verify: `vitest run` passes (all stubs pass trivially)

---

### Phase 1 — Foundation
1. Next.js project scaffold with TypeScript + Tailwind
2. MongoDB connection (`lib/db.ts` with Mongoose singleton)
3. User model + NextAuth credentials provider
4. Admin seed script (`scripts/seed-admin.ts`)
5. Middleware: protect `/admin/**` routes
6. Basic layout: public navbar, admin sidebar

Verify: Admin can log in and see dashboard. Protected routes redirect unauthenticated users.

---

### Phase 2 — Scoring Logic (TDD)
1. Write all tests in `lib/scoring.test.ts` first (the full truth table from §4)
2. Implement `lib/scoring.ts` (`validateSet`, `determineSetWinner`, `determineMatchWinner`)
3. All tests pass, coverage ≥ 90%

Verify: `vitest run lib/scoring.test.ts` fully green before moving on.

---

### Phase 3 — Tournament Creation & Setup
1. Tournament model + API routes (create, list, get, delete)
2. `/admin/tournament/new` form (name, team size, courts, input mode)
3. `/admin/tournament/[id]/setup` — team entry UI
4. Player auto-assignment logic
5. Team preview + shuffle button
6. "Start Tournament" validation
7. Write tests in `api/tournaments.test.ts`

Verify: Create a tournament with 8 player names, generate 4 teams of 2, check stored correctly.

---

### Phase 4 — Bracket Generation (TDD)
1. Write tests in `lib/bracket/generate.test.ts` first (4, 8, 16 teams; byes; format; labels)
2. Write tests in `lib/bracket/labels.test.ts`
3. Implement `generateBracket(teams, courtsAvailable)` in `lib/bracket/generate.ts`
4. Implement `lib/bracket/labels.ts`
5. Write tests for `api/start.test.ts`
6. Implement `/api/tournaments/[id]/start`

Verify: `vitest run lib/bracket/` green. Generate bracket for 3, 4, 5, 8, 16 teams. All connections correct. Byes auto-advance. Labels correct.

---

### Phase 5 — Bracket Visualization
1. `BracketView` component reading match data
2. `WinnerBracket` grid layout
3. `LoserBracket` grid layout
4. `MatchCard` with all status states and court badge
5. SVG connector lines between rounds
6. "Up Next" banner (first `ready` match(es) after any `in_progress`)
7. Responsive layout (tabs on mobile, side-by-side on desktop)
8. SWR polling every 5s on public view
9. Write component tests

Verify: Bracket renders correctly for 4 and 8 teams. Live match highlighted with court. Next match shown.

---

### Phase 6 — Score Entry & Advancement (TDD)
1. Write tests in `lib/bracket/advance.test.ts` first
2. Write tests in `api/scores.test.ts` and `api/status.test.ts`
3. Implement `lib/bracket/advance.ts` (`onMatchComplete`)
4. `ScoreEntry` modal component with set locking and re-entry
5. `/api/tournaments/[id]/matches/[matchId]/scores` PUT endpoint
6. `/api/tournaments/[id]/matches/[matchId]/status` PUT endpoint (court assignment + match confirm)
7. `MatchControls` for "Mark In Progress" and "Enter Scores" buttons
8. Court availability check and assignment
9. Tournament completion detection

Verify: Full 8-team tournament played through all matches. WB Final produces 1st/2nd. LB Final produces 3rd/4th. Tournament status = `completed`. Court limits enforced.

---

### Phase 7 — Polish & Production
1. Error states (API errors, invalid scores, no courts available)
2. Empty states (no tournaments, no teams)
3. Tournament completed screen with final standings (1st–4th Place)
4. Mobile testing
5. Loading skeletons for SWR fetches
6. Toast notifications for admin actions (score saved, match advanced)
7. Environment variable setup (`.env.local` template)
8. Deployment to Vercel + MongoDB Atlas connection

---

## Environment Variables

```env
MONGODB_URI=mongodb+srv://...
NEXTAUTH_SECRET=...           # random 32-char string
NEXTAUTH_URL=http://localhost:3000
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=...            # used only for seed script
```

---

## Seed Script

`scripts/seed-admin.ts` — run once:
```
1. Connect to MongoDB
2. Check if admin user exists
3. If not: hash password with bcrypt, insert User document
4. Disconnect
```

Run via: `npx tsx scripts/seed-admin.ts`

---

## Key Constraints & Edge Cases

| Case | Handling |
|---|---|
| Odd number of players | Extra players appended to last team (size+1) |
| Non-power-of-2 team count | Pad to next power of 2 with bye slots; randomly distributed |
| 2 teams | Single WB match (WB Final = isWBFinal), BO3. No LB needed. |
| Deuce (e.g. 10:10) | Winner needs ≥ 11 AND ≥ 2-point lead. No hard cap. |
| 1-point lead (11:10) | Rejected by `validateSet` with VALIDATION_ERROR |
| Score tie (11:11) | Rejected — volleyball cannot end in a tie |
| Score too low (9:7) | Rejected — winner < 11 |
| 22:20 in an 11-pt game | `detectPointsToWin` classifies as 21-pt game. Acceptable edge case. |
| Admin submits wrong score | Re-enter any set while match is `in_progress`. Must re-confirm. |
| All courts occupied | Status endpoint returns CONFLICT; "Mark In Progress" button disabled in UI |
| Deleting active tournament | Not allowed; only Draft tournaments can be deleted |
| WB Final loser | Gets 2nd place; no `loserNextMatchId`; does not enter LB |
| LB Final loser | Gets 4th place; no `loserNextMatchId`; eliminated |
| Tournament completion | Triggered when every non-bye match has status = 'completed' |
| Lucky Winner | Bye in WB R1; team auto-advances, no score entry needed |
| Lucky Loser | Corresponding LB R1 slot also a bye; team auto-advances in LB |

---

## File Checklist

```
# Core
lib/db.ts
lib/models/Tournament.ts
lib/models/User.ts
lib/scoring.ts
lib/bracket/generate.ts
lib/bracket/advance.ts
lib/bracket/labels.ts

# API routes
app/api/auth/[...nextauth]/route.ts
app/api/tournaments/route.ts
app/api/tournaments/[id]/route.ts
app/api/tournaments/[id]/start/route.ts
app/api/tournaments/[id]/matches/[matchId]/scores/route.ts
app/api/tournaments/[id]/matches/[matchId]/status/route.ts

# Pages
app/(public)/page.tsx
app/(public)/tournament/[id]/page.tsx
app/admin/login/page.tsx
app/admin/dashboard/page.tsx
app/admin/tournament/new/page.tsx
app/admin/tournament/[id]/setup/page.tsx
app/admin/tournament/[id]/manage/page.tsx

# Components
components/bracket/BracketView.tsx
components/bracket/WinnerBracket.tsx
components/bracket/LoserBracket.tsx
components/bracket/MatchCard.tsx
components/bracket/ConnectorLines.tsx
components/admin/ScoreEntry.tsx
components/admin/MatchControls.tsx

# Tests
__tests__/setup/db.ts
__tests__/lib/scoring.test.ts
__tests__/lib/bracket/generate.test.ts
__tests__/lib/bracket/advance.test.ts
__tests__/lib/bracket/labels.test.ts
__tests__/api/tournaments.test.ts
__tests__/api/start.test.ts
__tests__/api/scores.test.ts
__tests__/api/status.test.ts
__tests__/components/MatchCard.test.tsx
__tests__/components/ScoreEntry.test.tsx

# Config & scripts
vitest.config.ts
middleware.ts
scripts/seed-admin.ts
.env.local (template)
```
