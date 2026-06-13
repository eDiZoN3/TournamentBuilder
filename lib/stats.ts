import type { IMatch, ITeam, ITournament } from "@/lib/models/Tournament";

export interface StatsRow {
  name: string;
  playerProfileId?: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  setsWon: number;
  setsLost: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  tournamentPoints?: number;
  winRate: number;
}

export interface StatsResult {
  teams: StatsRow[];
  players: StatsRow[];
}

export type StatsResetScope = "player" | "tournament" | "season" | "all";

export interface StatsResetRule {
  scope: StatsResetScope;
  playerProfileId?: { toString(): string } | string | null;
  playerNameKey?: string | null;
  tournamentId?: { toString(): string } | string | null;
  season?: number | null;
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
  tournamentPoints: number;
  won: boolean;
}

function idString(
  id: { toString(): string } | string | null | undefined,
): string {
  return id?.toString() ?? "";
}

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function displayName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

function createStats(
  name: string,
  key: string,
  playerProfileId?: string,
): MutableStats {
  return {
    key,
    name: displayName(name),
    playerProfileId,
    matchesPlayed: 0,
    matchesWon: 0,
    matchesLost: 0,
    setsWon: 0,
    setsLost: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    pointDiff: 0,
    tournamentPoints: 0,
    winRate: 0,
  };
}

function ensureStats(
  statsByKey: Map<string, MutableStats>,
  key: string,
  name: string,
  playerProfileId?: string,
): MutableStats {
  const existing = statsByKey.get(key);

  if (existing) {
    return existing;
  }

  const stats = createStats(name, key, playerProfileId);

  statsByKey.set(key, stats);

  return stats;
}

function finalizeStats(stats: MutableStats): StatsRow {
  return {
    name: stats.name,
    playerProfileId: stats.playerProfileId,
    matchesPlayed: stats.matchesPlayed,
    matchesWon: stats.matchesWon,
    matchesLost: stats.matchesLost,
    setsWon: stats.setsWon,
    setsLost: stats.setsLost,
    pointsFor: stats.pointsFor,
    pointsAgainst: stats.pointsAgainst,
    pointDiff: stats.pointsFor - stats.pointsAgainst,
    tournamentPoints: stats.tournamentPoints,
    winRate:
      stats.matchesPlayed === 0 ? 0 : stats.matchesWon / stats.matchesPlayed,
  };
}

function sortStats(
  rows: StatsRow[],
  preferTournamentPoints = false,
): StatsRow[] {
  return [...rows].sort(
    (first, second) =>
      (preferTournamentPoints
        ? (second.tournamentPoints ?? 0) - (first.tournamentPoints ?? 0)
        : 0) ||
      second.matchesWon - first.matchesWon ||
      second.winRate - first.winRate ||
      second.pointDiff - first.pointDiff ||
      first.name.localeCompare(second.name),
  );
}

function emptyStats(): StatsResult {
  return {
    teams: [],
    players: [],
  };
}

function createdAtDate(tournament: ITournament): Date {
  return tournament.createdAt instanceof Date
    ? tournament.createdAt
    : new Date(tournament.createdAt);
}

function isTournamentInSeason(tournament: ITournament, season: number): boolean {
  const createdAt = createdAtDate(tournament);
  const seasonStart = Date.UTC(season, 0, 1);
  const nextSeasonStart = Date.UTC(season + 1, 0, 1);
  const createdAtTime = createdAt.getTime();

  return createdAtTime >= seasonStart && createdAtTime < nextSeasonStart;
}

function resetAppliesToTournament(
  rule: StatsResetRule,
  tournament: ITournament,
): boolean {
  if (rule.scope === "all") {
    return true;
  }

  if (rule.scope === "tournament") {
    return idString(rule.tournamentId) === idString(tournament._id);
  }

  if (rule.scope === "season" && typeof rule.season === "number") {
    return isTournamentInSeason(tournament, rule.season);
  }

  return false;
}

function playerResetNameKeys(resetRules: StatsResetRule[]): Set<string> {
  return new Set(
    resetRules
      .filter((rule) => rule.scope === "player")
      .map((rule) => rule.playerNameKey ?? "")
      .filter(Boolean),
  );
}

function playerResetProfileIds(resetRules: StatsResetRule[]): Set<string> {
  return new Set(
    resetRules
      .filter((rule) => rule.scope === "player")
      .map((rule) => idString(rule.playerProfileId))
      .filter(Boolean),
  );
}

function filterPlayerStats(
  rows: StatsRow[],
  resetRules: StatsResetRule[],
): StatsRow[] {
  const resetNameKeys = playerResetNameKeys(resetRules);
  const resetProfileIds = playerResetProfileIds(resetRules);

  if (resetNameKeys.size === 0 && resetProfileIds.size === 0) {
    return rows;
  }

  return rows.filter(
    (row) =>
      !(row.playerProfileId && resetProfileIds.has(row.playerProfileId)) &&
      !resetNameKeys.has(normalizeName(row.name)),
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

function eventByeCompleted(match: IMatch): boolean {
  return (
    match.status === "completed" &&
    match.isBye &&
    Boolean(match.teamA) &&
    Boolean(match.winnerId)
  );
}

function eventWinnerPoints(match: IMatch): number {
  return match.round + (match.isWBFinal ? 1 : 0);
}

function recordedSets(match: IMatch) {
  return match.teamA?.sets.length
    ? match.teamA.sets
    : (match.teamB?.sets ?? []);
}

function deltaForMatch(
  match: IMatch,
  side: "A" | "B",
  winnerTournamentPoints = 0,
): MatchSideDelta {
  const sets = recordedSets(match);
  const teamId = side === "A" ? match.teamA!.teamId : match.teamB!.teamId;
  const won = idString(match.winnerId) === idString(teamId);
  const delta: MatchSideDelta = {
    lost: !won,
    pointsAgainst: 0,
    pointsFor: 0,
    setsLost: 0,
    setsWon: 0,
    tournamentPoints: won ? winnerTournamentPoints : 0,
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
  stats.tournamentPoints = (stats.tournamentPoints ?? 0) + delta.tournamentPoints;
}

function applyPlayers(
  team: ITeam,
  playerStatsByKey: Map<string, MutableStats>,
  delta: MatchSideDelta,
) {
  for (const [index, player] of team.players.entries()) {
    const name = displayName(player);
    const playerProfileId = team.playerProfileIds?.[index]?.toString();

    if (!name) {
      continue;
    }

    applyDelta(
      ensureStats(
        playerStatsByKey,
        playerProfileId ? `profile:${playerProfileId}` : `name:${normalizeName(name)}`,
        name,
        playerProfileId,
      ),
      delta,
    );
  }
}

function teamById(teams: ITeam[]): Map<string, ITeam> {
  return new Map(teams.map((team) => [idString(team._id), team]));
}

export function calculateTournamentStats(
  tournament: ITournament,
  resetRules: StatsResetRule[] = [],
): StatsResult {
  if (resetRules.some((rule) => resetAppliesToTournament(rule, tournament))) {
    return emptyStats();
  }

  const teamStatsByKey = new Map<string, MutableStats>();
  const playerStatsByKey = new Map<string, MutableStats>();
  const teamsById = teamById(tournament.teams);

  for (const team of tournament.teams) {
    ensureStats(teamStatsByKey, idString(team._id), team.name);

    for (const [index, player] of team.players.entries()) {
      const name = displayName(player);
      const playerProfileId = team.playerProfileIds?.[index]?.toString();

      if (name) {
        ensureStats(
          playerStatsByKey,
          playerProfileId ? `profile:${playerProfileId}` : `name:${normalizeName(name)}`,
          name,
          playerProfileId,
        );
      }
    }
  }

  const isEventTournament = tournament.format === "event";

  for (const match of tournament.matches) {
    if (isEventTournament && eventByeCompleted(match)) {
      const winningTeam = teamsById.get(idString(match.winnerId));

      if (!winningTeam) {
        continue;
      }

      const byeDelta: MatchSideDelta = {
        lost: false,
        pointsAgainst: 0,
        pointsFor: 0,
        setsLost: 0,
        setsWon: 0,
        tournamentPoints: eventWinnerPoints(match),
        won: true,
      };

      applyDelta(
        ensureStats(teamStatsByKey, idString(winningTeam._id), winningTeam.name),
        byeDelta,
      );
      applyPlayers(winningTeam, playerStatsByKey, byeDelta);
      continue;
    }

    if (!playableCompleted(match)) {
      continue;
    }

    const teamA = teamsById.get(idString(match.teamA!.teamId));
    const teamB = teamsById.get(idString(match.teamB!.teamId));

    if (!teamA || !teamB) {
      continue;
    }

    const winnerTournamentPoints = isEventTournament ? eventWinnerPoints(match) : 0;
    const deltaA = deltaForMatch(match, "A", winnerTournamentPoints);
    const deltaB = deltaForMatch(match, "B", winnerTournamentPoints);

    applyDelta(ensureStats(teamStatsByKey, idString(teamA._id), teamA.name), deltaA);
    applyDelta(ensureStats(teamStatsByKey, idString(teamB._id), teamB.name), deltaB);
    applyPlayers(teamA, playerStatsByKey, deltaA);
    applyPlayers(teamB, playerStatsByKey, deltaB);
  }

  return {
    teams: sortStats(
      [...teamStatsByKey.values()].map(finalizeStats),
      isEventTournament,
    ),
    players: filterPlayerStats(
      sortStats(
        [...playerStatsByKey.values()].map(finalizeStats),
        isEventTournament,
      ),
      resetRules,
    ),
  };
}

function mergeStats(
  targetByKey: Map<string, MutableStats>,
  sourceRows: StatsRow[],
) {
  for (const row of sourceRows) {
    const key = row.playerProfileId
      ? `profile:${row.playerProfileId}`
      : `name:${normalizeName(row.name)}`;
    const stats = ensureStats(
      targetByKey,
      key,
      row.name,
      row.playerProfileId,
    );

    stats.matchesPlayed += row.matchesPlayed;
    stats.matchesWon += row.matchesWon;
    stats.matchesLost += row.matchesLost;
    stats.setsWon += row.setsWon;
    stats.setsLost += row.setsLost;
    stats.pointsFor += row.pointsFor;
    stats.pointsAgainst += row.pointsAgainst;
    stats.tournamentPoints =
      (stats.tournamentPoints ?? 0) + (row.tournamentPoints ?? 0);
  }
}

export function aggregateStats(
  tournaments: ITournament[],
  resetRules: StatsResetRule[] = [],
): StatsResult {
  const teamStatsByKey = new Map<string, MutableStats>();
  const playerStatsByKey = new Map<string, MutableStats>();
  const tournamentsForStats = tournaments.filter(
    (tournament) =>
      !resetRules.some((rule) => resetAppliesToTournament(rule, tournament)),
  );

  for (const tournament of tournamentsForStats) {
    const stats = calculateTournamentStats(tournament, resetRules);

    mergeStats(teamStatsByKey, stats.teams);
    mergeStats(playerStatsByKey, stats.players);
  }

  return {
    teams: sortStats([...teamStatsByKey.values()].map(finalizeStats)),
    players: filterPlayerStats(
      sortStats([...playerStatsByKey.values()].map(finalizeStats)),
      resetRules,
    ),
  };
}
