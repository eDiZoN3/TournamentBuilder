import { normalizeName, type StatsResetRule, type StatsRow } from "@/lib/stats";

export interface PracticeStatsRow extends StatsRow {
  playerProfileId: string;
}

interface MutablePracticeStats extends PracticeStatsRow {
  key: string;
}

interface PracticeParticipantLike {
  playerProfileId?: { toString(): string } | string | null;
  displayName: string;
}

interface PracticeSetScoreLike {
  scoreA: number;
  scoreB: number;
  pointsToWin?: number;
}

interface PracticeMatchLike {
  createdBy?: { toString(): string } | string | null;
  playedAt?: Date | string;
  sets: PracticeSetScoreLike[];
  sideA: PracticeParticipantLike[];
  sideB: PracticeParticipantLike[];
  winnerSide: string;
}

function idString(id: { toString(): string } | string | null | undefined) {
  return id?.toString() ?? "";
}

function displayName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

function createStats(
  playerProfileId: string,
  name: string,
): MutablePracticeStats {
  return {
    key: playerProfileId,
    playerProfileId,
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
  statsByProfileId: Map<string, MutablePracticeStats>,
  participant: PracticeParticipantLike,
): MutablePracticeStats | null {
  const playerProfileId = idString(participant.playerProfileId);

  if (!playerProfileId) {
    return null;
  }

  const existing = statsByProfileId.get(playerProfileId);

  if (existing) {
    return existing;
  }

  const stats = createStats(playerProfileId, participant.displayName);

  statsByProfileId.set(playerProfileId, stats);

  return stats;
}

function finalizeStats(stats: MutablePracticeStats): PracticeStatsRow {
  return {
    playerProfileId: stats.playerProfileId,
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

function sortStats(rows: PracticeStatsRow[]): PracticeStatsRow[] {
  return [...rows].sort(
    (first, second) =>
      second.matchesWon - first.matchesWon ||
      second.winRate - first.winRate ||
      second.pointDiff - first.pointDiff ||
      first.name.localeCompare(second.name),
  );
}

function sideTotals(sets: PracticeSetScoreLike[], side: "A" | "B") {
  return sets.reduce(
    (totals, set) => {
      const pointsFor = side === "A" ? set.scoreA : set.scoreB;
      const pointsAgainst = side === "A" ? set.scoreB : set.scoreA;

      totals.pointsFor += pointsFor;
      totals.pointsAgainst += pointsAgainst;

      if (pointsFor > pointsAgainst) {
        totals.setsWon += 1;
      } else {
        totals.setsLost += 1;
      }

      return totals;
    },
    {
      pointsAgainst: 0,
      pointsFor: 0,
      setsLost: 0,
      setsWon: 0,
    },
  );
}

function applyMatchSide(
  statsByProfileId: Map<string, MutablePracticeStats>,
  participants: PracticeParticipantLike[],
  match: PracticeMatchLike,
  side: "A" | "B",
) {
  const totals = sideTotals(match.sets, side);
  const won = match.winnerSide === side;

  for (const participant of participants) {
    const stats = ensureStats(statsByProfileId, participant);

    if (!stats) {
      continue;
    }

    stats.matchesPlayed += 1;
    stats.matchesWon += won ? 1 : 0;
    stats.matchesLost += won ? 0 : 1;
    stats.setsWon += totals.setsWon;
    stats.setsLost += totals.setsLost;
    stats.pointsFor += totals.pointsFor;
    stats.pointsAgainst += totals.pointsAgainst;
  }
}

function resetPlayerIds(resetRules: StatsResetRule[]): Set<string> {
  return new Set(
    resetRules
      .filter((rule) => rule.scope === "player")
      .map((rule) => idString(rule.playerProfileId))
      .filter(Boolean),
  );
}

function resetPlayerNameKeys(resetRules: StatsResetRule[]): Set<string> {
  return new Set(
    resetRules
      .filter((rule) => rule.scope === "player")
      .map((rule) => rule.playerNameKey ?? "")
      .filter(Boolean),
  );
}

export function aggregatePracticeStats(
  practiceMatches: PracticeMatchLike[],
  resetRules: StatsResetRule[] = [],
): PracticeStatsRow[] {
  if (resetRules.some((rule) => rule.scope === "all")) {
    return [];
  }

  const statsByProfileId = new Map<string, MutablePracticeStats>();

  for (const match of practiceMatches) {
    applyMatchSide(statsByProfileId, match.sideA, match, "A");
    applyMatchSide(statsByProfileId, match.sideB, match, "B");
  }

  const profileIds = resetPlayerIds(resetRules);
  const nameKeys = resetPlayerNameKeys(resetRules);

  return sortStats(
    Array.from(statsByProfileId.values())
      .filter(
        (stats) =>
          !profileIds.has(stats.playerProfileId) &&
          !nameKeys.has(normalizeName(stats.name)),
      )
      .map(finalizeStats),
  );
}
