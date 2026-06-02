# Tournament Builder — Product Specification

## What It Is

A web app for running volleyball tournaments with friends. One person (the admin) sets it up and runs it. Everyone else opens the link and watches the bracket live.

---

## User Roles

| Role | What they can do |
|---|---|
| **Admin** | Create/manage tournaments, enter scores, manage courts. Must log in. |
| **Public** | View any tournament bracket in real time. No login needed. |

One admin account exists. It is created by running a setup script once.

---

## Tournament Lifecycle

### 1. Create
Admin fills in:
- Tournament name
- Team size (2, 3, or 4 players per team)
- Number of courts available (1–10)
- Input mode: enter full team names, or enter individual player names for auto-grouping

### 2. Setup
Admin enters teams or players.

**Team mode**: admin types each team name directly.

**Player mode**: admin enters player names one at a time. The app randomly groups them into teams of the chosen size. If players don't divide evenly, the last team gets the extra players. Admin can shuffle the grouping and rename teams before confirming.

Minimum: 2 teams. No maximum (bracket pads to next power of 2).

### 3. Start
Admin clicks "Start Tournament." The app:
- Randomly seeds all teams (pure shuffle — no skill-based seeding)
- Generates the full bracket automatically
- Sets the tournament to "Active"
- Redirects admin to the manage page

### 4. Run Matches

The admin drives the tournament match by match:

1. See which matches are **Ready** (both teams known, waiting to play)
2. Click **"Mark as In Progress"** — the match gets assigned a court number (e.g. "Court 2"). Up to `courtsAvailable` matches can run at the same time.
3. After the match is played, click **"Enter Scores"** — a form opens to type in the scores
4. Click **"Confirm Match"** — the bracket updates, next matches unlock

Scores can be corrected at any time before "Confirm Match" is clicked.

### 5. Completion
The tournament ends automatically when all matches (Winner Bracket and Loser Bracket) are confirmed. A final standings screen appears.

---

## Bracket Structure

### Winner Bracket (WB)
All teams start here. Win → advance. Lose → drop to Loser Bracket.

The WB Final winner is **1st place**. The WB Final loser is **2nd place** (they do not continue playing).

### Loser Bracket (LB)
Teams that lost once in the WB continue here. Win → keep playing. Lose → eliminated.

The LB is a consolation bracket — teams here cannot finish 1st or 2nd. The LB Final winner is **3rd place**, loser is **4th place**.

There is **no Grand Final** between WB and LB champions. The WB Final is the tournament's decisive match.

### Byes
If the number of teams is not a power of 2 (e.g. 6 teams), the bracket pads to the next power of 2 (8 slots). The extra slots are "byes." A team paired with a bye automatically advances without playing — they are the **Lucky Winner**. The corresponding LB slot that would have received that match's loser also becomes a bye (**Lucky Loser** — advances in LB without playing).

Which teams get byes is random, determined by the shuffle order at bracket generation.

---

## Match Formats

| Match | Format |
|---|---|
| WB Semi-Final | Best-of-3 |
| WB Final | Best-of-3 |
| LB Final | Best-of-3 |
| All other WB and LB matches | Best-of-1 |

For a 4-team tournament, every match is Best-of-3 (since all matches are in the last 2 WB rounds or the LB Final).

---

## Scoring Rules

Sets are first to 11 or 21 points **with a 2-point lead**. No hard cap.

Valid wins: 11:9, 12:10, 15:13, 21:19, 23:21, 25:23 ...
Invalid: 11:10 (only 1-point lead), 11:11 (tie)

The app automatically detects whether a set was played to 11 or 21 based on the winning score:
- Winning score ≥ 21 → 21-point set
- Winning score 11–20 → 11-point set
- Winning score < 11 → rejected as too low

Ties are impossible in volleyball and are rejected.

### Best-of-3 sets
Sets are entered one at a time. The next set unlocks after the previous one is saved. A match winner is determined when one team wins 2 sets. The 3rd set is only played if the first two sets split 1-1.

---

## Courts

Each tournament has a fixed number of courts (set at creation). The system tracks which matches are currently in progress and enforces the court limit.

When the admin marks a match as "In Progress":
- The system assigns the lowest available court number (Court 1, Court 2, ...)
- The court number is shown on the match card in the bracket view (visible to everyone)
- If all courts are occupied, the "Mark as In Progress" button is disabled

When a match is confirmed, its court is freed for the next match.

---

## Bracket View (Public)

The bracket is visible to anyone with the link. It refreshes automatically every 5 seconds while the tournament is active. Polling stops when the tournament is completed.

Matches show:
- Team names
- Scores (once entered and confirmed)
- Status: TBD / Ready / LIVE (with court number) / Completed
- Winner highlighted in green

On desktop: Winner Bracket and Loser Bracket shown side by side.
On mobile: tabs to switch between brackets.

An "Up Next" banner shows all matches currently in Ready state (up to 3), helping spectators know what's coming.

---

## Admin Score Entry

Admin-only. Accessible from the Manage page.

For each match:
1. Mark as In Progress (assigns court)
2. Open "Enter Scores" modal
3. Type in set scores; the system validates them and shows a validation error if the win condition isn't met
4. For BO3: set 2 unlocks after set 1 is saved. Any set can be corrected before confirmation.
5. Once a winner is determined, "Confirm Match" appears
6. Click Confirm → bracket advances automatically

---

## Final Standings

After all matches complete, the tournament shows:

| Place | Determined by |
|---|---|
| 1st | WB Final winner |
| 2nd | WB Final loser |
| 3rd | LB Final winner |
| 4th | LB Final loser |
| 5th–6th | Teams eliminated in LB round before LB Final |
| 7th–8th | Teams eliminated in LB R1 (for 8-team brackets) |

---

## What Is Out of Scope (v1)

- Grand Final bracket reset (WB champion vs LB champion rematch)
- Multiple admin accounts
- Match scheduling / time slots
- Statistics or player profiles
- Mobile push notifications
- Score history / audit log
- Undo confirmed match (admin must contact developer to reset)
- Editing a tournament after it has started (team names, court count, etc.)
