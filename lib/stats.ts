import type { IMatch, ITeam, ITournament } from "@/lib/models/Tournament";

export interface StatsRow {
  name: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  setsWon: number;
  setsLost: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  winRate: number;
}

export interface StatsResult {
  teams: StatsRow[];
  players: StatsRow[];
}

interface MutableStats extends StatsRow {
  key: string;
}

interface MatchSideDelta {
  lost: boolean;
  pointsAgainst: number;
  pointsFor: number;
  setsLost: number;
  setsWon: number;
  won: boolean;
}

function idString(id: { toString(): string } | string | null): string {
  return id?.toString() ?? "";
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function displayName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

function createStats(name: string, key: string): MutableStats {
  return {
    key,
    name: displayName(name),
    matchesPlayed: 0,
    matchesWon: 0,
    matchesLost: 0,
    setsWon: 0,
    setsLost: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    pointDiff: 0,
    winRate: 0,
  };
}

function ensureStats(
  statsByKey: Map<string, MutableStats>,
  key: string,
  name: string,
): MutableStats {
  const existing = statsByKey.get(key);

  if (existing) {
    return existing;
  }

  const stats = createStats(name, key);

  statsByKey.set(key, stats);

  return stats;
}

function finalizeStats(stats: MutableStats): StatsRow {
  return {
    name: stats.name,
    matchesPlayed: stats.matchesPlayed,
    matchesWon: stats.matchesWon,
    matchesLost: stats.matchesLost,
    setsWon: stats.setsWon,
    setsLost: stats.setsLost,
    pointsFor: stats.pointsFor,
    pointsAgainst: stats.pointsAgainst,
    pointDiff: stats.pointsFor - stats.pointsAgainst,
    winRate:
      stats.matchesPlayed === 0 ? 0 : stats.matchesWon / stats.matchesPlayed,
  };
}

function sortStats(rows: StatsRow[]): StatsRow[] {
  return [...rows].sort(
    (first, second) =>
      second.matchesWon - first.matchesWon ||
      second.winRate - first.winRate ||
      second.pointDiff - first.pointDiff ||
      first.name.localeCompare(second.name),
  );
}

function playableCompleted(match: IMatch): boolean {
  return (
    match.status === "completed" &&
    !match.isBye &&
    Boolean(match.teamA) &&
    Boolean(match.teamB) &&
    Boolean(match.winnerId)
  );
}

function recordedSets(match: IMatch) {
  return match.teamA?.sets.length
    ? match.teamA.sets
    : (match.teamB?.sets ?? []);
}

function deltaForMatch(match: IMatch, side: "A" | "B"): MatchSideDelta {
  const sets = recordedSets(match);
  const teamId = side === "A" ? match.teamA!.teamId : match.teamB!.teamId;
  const won = idString(match.winnerId) === idString(teamId);
  const delta: MatchSideDelta = {
    lost: !won,
    pointsAgainst: 0,
    pointsFor: 0,
    setsLost: 0,
    setsWon: 0,
    won,
  };

  for (const set of sets) {
    const sideScore = side === "A" ? set.scoreA : set.scoreB;
    const opponentScore = side === "A" ? set.scoreB : set.scoreA;

    delta.pointsFor += sideScore;
    delta.pointsAgainst += opponentScore;

    if (sideScore > opponentScore) {
      delta.setsWon += 1;
    } else {
      delta.setsLost += 1;
    }
  }

  return delta;
}

function applyDelta(stats: MutableStats, delta: MatchSideDelta) {
  stats.matchesPlayed += 1;
  stats.matchesWon += delta.won ? 1 : 0;
  stats.matchesLost += delta.lost ? 1 : 0;
  stats.setsWon += delta.setsWon;
  stats.setsLost += delta.setsLost;
  stats.pointsFor += delta.pointsFor;
  stats.pointsAgainst += delta.pointsAgainst;
}

function applyPlayers(
  players: string[],
  playerStatsByKey: Map<string, MutableStats>,
  delta: MatchSideDelta,
) {
  for (const player of players) {
    const name = displayName(player);

    if (!name) {
      continue;
    }

    applyDelta(ensureStats(playerStatsByKey, normalizeName(name), name), delta);
  }
}

function teamById(teams: ITeam[]): Map<string, ITeam> {
  return new Map(teams.map((team) => [idString(team._id), team]));
}

export function calculateTournamentStats(tournament: ITournament): StatsResult {
  const teamStatsByKey = new Map<string, MutableStats>();
  const playerStatsByKey = new Map<string, MutableStats>();
  const teamsById = teamById(tournament.teams);

  for (const team of tournament.teams) {
    ensureStats(teamStatsByKey, idString(team._id), team.name);

    for (const player of team.players) {
      const name = displayName(player);

      if (name) {
        ensureStats(playerStatsByKey, normalizeName(name), name);
      }
    }
  }

  for (const match of tournament.matches) {
    if (!playableCompleted(match)) {
      continue;
    }

    const teamA = teamsById.get(idString(match.teamA!.teamId));
    const teamB = teamsById.get(idString(match.teamB!.teamId));

    if (!teamA || !teamB) {
      continue;
    }

    const deltaA = deltaForMatch(match, "A");
    const deltaB = deltaForMatch(match, "B");

    applyDelta(ensureStats(teamStatsByKey, idString(teamA._id), teamA.name), deltaA);
    applyDelta(ensureStats(teamStatsByKey, idString(teamB._id), teamB.name), deltaB);
    applyPlayers(teamA.players, playerStatsByKey, deltaA);
    applyPlayers(teamB.players, playerStatsByKey, deltaB);
  }

  return {
    teams: sortStats([...teamStatsByKey.values()].map(finalizeStats)),
    players: sortStats([...playerStatsByKey.values()].map(finalizeStats)),
  };
}

function mergeStats(
  targetByKey: Map<string, MutableStats>,
  sourceRows: StatsRow[],
) {
  for (const row of sourceRows) {
    const stats = ensureStats(targetByKey, normalizeName(row.name), row.name);

    stats.matchesPlayed += row.matchesPlayed;
    stats.matchesWon += row.matchesWon;
    stats.matchesLost += row.matchesLost;
    stats.setsWon += row.setsWon;
    stats.setsLost += row.setsLost;
    stats.pointsFor += row.pointsFor;
    stats.pointsAgainst += row.pointsAgainst;
  }
}

export function aggregateStats(tournaments: ITournament[]): StatsResult {
  const teamStatsByKey = new Map<string, MutableStats>();
  const playerStatsByKey = new Map<string, MutableStats>();

  for (const tournament of tournaments) {
    const stats = calculateTournamentStats(tournament);

    mergeStats(teamStatsByKey, stats.teams);
    mergeStats(playerStatsByKey, stats.players);
  }

  return {
    teams: sortStats([...teamStatsByKey.values()].map(finalizeStats)),
    players: sortStats([...playerStatsByKey.values()].map(finalizeStats)),
  };
}
