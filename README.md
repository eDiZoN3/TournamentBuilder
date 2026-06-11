# Raro Volleyball Tournament Builder

A web application for organizing and running volleyball tournaments — from a
casual game night with friends to a multi-discipline event day. An organizer
sets up the tournament and runs the matches, while everyone else follows the
live bracket, standings, and statistics from any device, no login required.

Built with the Next.js App Router, it ships with four tournament formats, live
court scheduling and scoring, player accounts with self-join, per-tournament and
global statistics, practice-match tracking, and full English/German + dark/light
support.

---

## Highlights

- **Four tournament formats** — knockout (single or double elimination),
  round robin, individual mixer, and parallel multi-discipline events.
- **Flexible rosters** — type team names, enter players and auto-group them, or
  let registered players add themselves.
- **Live operations** — assign courts, enter set scores, and watch the bracket
  update in real time (5-second polling, no WebSocket setup needed).
- **Statistics everywhere** — team and player leaderboards per tournament and
  across the whole season, plus casual practice-match stats.
- **Spectator-friendly** — a public, read-only view of every active tournament.
- **Bilingual & themeable** — English/German and dark/light, remembered per
  device and applied before first paint (no flash).

---

## Tournament Formats

Pick a format when creating a tournament; the setup screen then adapts to it.

### Elimination (knockout)
Classic bracket play with automatic byes — any number of teams is padded up to
the next power of two.

- **Double elimination** — a Winner Bracket decides 1st/2nd and a Loser Bracket
  decides 3rd/4th, so an early loss isn't the end.
- **Single elimination** — one loss and you're out.
- **First-round pairing** — drawn at random, or arranged manually.
- **Scoring** — full **points** (set-by-set, to 11 or 21) or **winner only**
  (just record who won).
- **Match length** — best-of-one, or best-of-three for the semi-finals and final.

### Team round robin
Every team plays every other team once and is ranked by record. Matches can be a
single set or best-of-three.

### Individual mixer
Players are entered individually and mixed into fresh teams — ideal for drop-in
sessions where you want balanced sides rather than fixed squads.

### Event (multi-discipline)
Several single-elimination disciplines run **in parallel** on one court, each
with its own bracket and champion. Uses winner-only scoring and is perfect for a
games-day format. Participants can be entered by the organizer or, in player
mode, can self-join with their account.

---

## Rosters & Player Accounts

- **Team entry** — type team names directly.
- **Player entry** — enter players and let the app group them into teams of 2, 3,
  or 4; or generate balanced teams automatically.
- **Self-join** — open a player-mode tournament so registered players add
  themselves during the draft phase (supported for round-robin, mixer, and
  player-mode events). Self-joined players flow straight into the roster.

## Roles & Access

| Role | Can do |
| --- | --- |
| **Spectator** (no account) | View live brackets, standings, and statistics. |
| **Player** | Register, join open tournaments, track personal stats, and log practice matches. |
| **Tournament lead** | Create and run tournaments: rosters, courts, scores, and results. |
| **Admin** | Everything a lead can do, plus manage player and lead accounts, reset temporary passwords, and reset statistics. |

Admin and tournament-lead pages live under `/admin` and are protected by
middleware; player and spectator pages are public.

---

## Running a Tournament

1. **Create** — name it, choose a format, set scoring/match options, courts, and
   roster mode.
2. **Set up** — add teams or players (or open self-join), confirm the roster, and
   for events name the disciplines.
3. **Start** — the bracket engine generates all matches, seeds the first round,
   and schedules the opening matches across the available courts.
4. **Run** — mark matches in progress, assign or override courts, and enter set
   scores. Winners advance automatically through the winner/loser brackets.
5. **Correct mistakes** — overriding a result rolls back any downstream matches
   that depended on it, so the bracket stays consistent.
6. **Finish** — final standings and statistics are published automatically.

The scoring and bracket logic lives in `lib/scoring.ts` and `lib/bracket/`
(`generate`, `advance`, `rollback`, `scheduler`, `labels`).

---

## Statistics & Practice Matches

- **Per-tournament stats** — team and player tables with matches played/won/lost,
  sets won/lost, points for/against and differential, and win rate.
- **Global stats** — the same leaderboards aggregated across all tournaments.
- **Winner-only tournaments** automatically hide point-based columns, since no
  scores are recorded.
- **Practice matches** — players log casual games from their account, which feed
  a separate practice-stats view.
- **Stats reset** — admins can reset statistics by scope: a single tournament, a
  season, a player, a profile, or everything.

---

## Internationalization & Theming

- **Languages** — English and German, switchable in the navigation and persisted
  in `localStorage`.
- **Theme** — dark and light, persisted per device. Both locale and theme are
  applied by an inline script before React hydrates to avoid any flash.

---

## API & Documentation

All functionality is backed by REST routes under `app/api/`. An OpenAPI document
is served at `/api/openapi`, with an interactive Swagger UI at `/api-docs`.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with a small shared component library
  (`components/ui/`) and the Inter typeface
- **Database**: MongoDB via Mongoose
- **Authentication**: NextAuth.js (credentials)
- **Live updates**: SWR polling
- **Testing**: Vitest + React Testing Library, with an in-memory MongoDB
  (`mongodb-memory-server`) for API tests

---

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment template and fill in your values:
   ```bash
   cp .env.local.template .env.local
   ```
   Required variables:
   - `MONGODB_URI` — MongoDB connection string
   - `NEXTAUTH_SECRET` — random secret for session signing
   - `NEXTAUTH_URL` — base URL (e.g. `http://localhost:3000`)
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` — credentials for the seeded admin

3. Seed the initial admin account:
   ```bash
   npm run seed:admin
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) to browse tournaments, or
   [http://localhost:3000/admin](http://localhost:3000/admin) to sign in and
   manage them.

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type check (no emit) |
| `npm run test` | Run all tests once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:coverage` | Tests with a coverage report |
| `npm run seed:admin` | Seed the initial admin account |

Run a single test file:
```bash
npx vitest run __tests__/lib/bracket/generate.test.ts
```

---

## Project Structure

```
app/
  (public)/      Spectator and player pages (home, login, signup, account, stats, bracket view)
  admin/         Organizer pages (dashboard, create, setup, manage) — protected by middleware
  api/           REST routes (admin routes under api/admin)
components/
  bracket/       Bracket, standings, and live tournament views
  event/         Multi-discipline event view
  admin/         Setup, scoring, and management UI
  stats/         Statistics tables
  ui/            Shared design system (Button, Card, Field, OptionCard, Navbar, …)
lib/
  bracket/       Bracket engine: generate, advance, rollback, scheduler, labels
  models/        Mongoose models (Tournament, User, PlayerProfile, PracticeMatch, …)
  scoring.ts     Set-score validation and winner determination
  i18n.ts        English/German translations
__tests__/       Tests mirroring the source tree
```

---

## Verification

Run the automated checks before deploying:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

---

## Deployment Notes

- Use MongoDB Atlas or another reachable MongoDB instance for `MONGODB_URI`.
- Set `NEXTAUTH_URL` to the deployed application URL.
- Keep `NEXTAUTH_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` configured through
  environment variables.
