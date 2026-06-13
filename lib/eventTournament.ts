import { Types } from "mongoose";
import { rollbackCompletedMatch } from "@/lib/bracket/rollback";
import type { IMatch, ITeam, ITeamSlot, ITournament } from "@/lib/models/Tournament";

type Slot = "A" | "B";

interface FirstRoundEntity {
  firstSeed: number;
  isBye: boolean;
  secondSeed: number | null;
}

export interface EventTournamentConfig {
  bracketSize: number;
  byeCount: number;
  byePoolSize: number;
  byeQuotas: number[];
  disciplineCount: number;
  participantCount: number;
  roundCount: number;
}

export interface EventSlotPlan {
  index: number;
  matches: IMatch[];
}

export interface EventSlotPlanOptions {
  pinnedFirstSlotMatchIds?: string[];
}

export interface EventWinnerResult {
  affectedMatchIds: string[];
  loserId: string | null;
  nextMatchesReady: string[];
  selected: boolean;
  tournamentCompleted: boolean;
  winnerId: string | null;
}

export function defaultEventDisciplines(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `Discipline ${index + 1}`);
}

function nextPowerOfTwo(value: number): number {
  let result = 1;

  while (result < value) {
    result *= 2;
  }

  return result;
}

function calculateSeededByeQuotas(
  participantCount: number,
  disciplineCount: number,
  byeCount: number,
): number[] {
  const totalByes = byeCount * disciplineCount;

  if (totalByes === 0) {
    return [];
  }

  const lastSeedIndex = participantCount - 1;
  const lastSeedCap = totalByes <= (participantCount - 1) * disciplineCount ? 0 : 1;
  const caps = Array.from({ length: participantCount }, (_, index) =>
    index === lastSeedIndex ? lastSeedCap : disciplineCount,
  );
  const weights = Array.from({ length: participantCount }, (_, index) =>
    caps[index] > 0 ? participantCount - index : 0,
  );
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const rawQuotas = weights.map((weight) => (totalByes * weight) / totalWeight);
  const byeQuotas = rawQuotas.map((quota, index) =>
    Math.min(caps[index], Math.floor(quota)),
  );
  let remaining = totalByes - byeQuotas.reduce((sum, quota) => sum + quota, 0);
  const priority = rawQuotas
    .map((quota, index) => ({
      fraction: quota - Math.floor(quota),
      index,
      weight: weights[index],
    }))
    .sort(
      (first, second) =>
        second.fraction - first.fraction ||
        second.weight - first.weight ||
        first.index - second.index,
    );

  while (remaining > 0) {
    let assigned = false;

    for (const { index } of priority) {
      if (remaining === 0) {
        break;
      }

      if (byeQuotas[index] < caps[index]) {
        byeQuotas[index] += 1;
        remaining -= 1;
        assigned = true;
      }
    }

    if (!assigned) {
      break;
    }
  }

  return byeQuotas;
}

export function deriveEventConfig(
  participantCount: number,
  disciplineCount: number,
): EventTournamentConfig {
  if (
    !Number.isInteger(participantCount) ||
    participantCount < 2 ||
    participantCount > 32
  ) {
    throw new Error("Event tournaments require 2 to 32 participants");
  }

  if (
    !Number.isInteger(disciplineCount) ||
    disciplineCount < 1 ||
    disciplineCount > 10
  ) {
    throw new Error("Event tournaments require 1 to 10 disciplines");
  }

  const bracketSize = nextPowerOfTwo(participantCount);
  const byeCount = bracketSize - participantCount;
  const byeQuotas = calculateSeededByeQuotas(
    participantCount,
    disciplineCount,
    byeCount,
  );

  return {
    participantCount,
    disciplineCount,
    bracketSize,
    byeCount,
    roundCount: Math.log2(bracketSize),
    byePoolSize: byeQuotas.length,
    byeQuotas,
  };
}

function mulberry32(seed: number): () => number {
  let value = seed;

  return () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;

    let next = Math.imul(value ^ (value >>> 15), 1 | value);
    next = (next + Math.imul(next ^ (next >>> 7), 61 | next)) ^ next;

    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(values: T[], rng: () => number): T[] {
  const shuffled = [...values];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

function pairKey(firstSeed: number, secondSeed: number): string {
  return `${Math.min(firstSeed, secondSeed)}-${Math.max(firstSeed, secondSeed)}`;
}

function assignEventByes(config: EventTournamentConfig): number[][] {
  const remaining = new Map<number, number>();
  const lastUsed = new Map<number, number>();
  const plan: number[][] = [];

  config.byeQuotas.forEach((quota, index) => {
    const seed = index + 1;

    remaining.set(seed, quota);
    lastUsed.set(seed, -1);
  });

  for (let disciplineIndex = 0; disciplineIndex < config.disciplineCount; disciplineIndex += 1) {
    const chosen = [...remaining.entries()]
      .filter(([, quota]) => quota > 0)
      .sort(
        ([firstSeed, firstQuota], [secondSeed, secondQuota]) =>
          secondQuota - firstQuota ||
          (lastUsed.get(firstSeed) ?? -1) - (lastUsed.get(secondSeed) ?? -1) ||
          firstSeed - secondSeed,
      )
      .slice(0, config.byeCount)
      .map(([seed]) => seed)
      .sort((first, second) => first - second);

    for (const seed of chosen) {
      remaining.set(seed, (remaining.get(seed) ?? 0) - 1);
      lastUsed.set(seed, disciplineIndex);
    }

    plan.push(chosen);
  }

  return plan;
}

function pairRoundOne(
  players: number[],
  usedPairs: Set<string>,
  rng: () => number,
): Array<[number, number]> {
  const half = players.length / 2;
  const strong = players.slice(0, half);
  const weak = players.slice(half);

  function backtrack(
    index: number,
    taken: Set<number>,
    pairs: Array<[number, number]>,
  ): Array<[number, number]> | null {
    if (index === half) {
      return pairs;
    }

    for (const weakSeed of shuffle(weak, rng)) {
      if (
        taken.has(weakSeed) ||
        usedPairs.has(pairKey(strong[index], weakSeed))
      ) {
        continue;
      }

      taken.add(weakSeed);

      const result = backtrack(index + 1, taken, [
        ...pairs,
        [strong[index], weakSeed],
      ]);

      if (result) {
        return result;
      }

      taken.delete(weakSeed);
    }

    return null;
  }

  const pairs =
    backtrack(0, new Set(), []) ??
    strong.map((seed, index) => [seed, weak[index]] as [number, number]);

  pairs.forEach(([firstSeed, secondSeed]) => {
    usedPairs.add(pairKey(firstSeed, secondSeed));
  });

  return pairs;
}

function bracketOrder(matchCount: number): number[] {
  let ranks = [1];

  while (ranks.length < matchCount) {
    const nextSize = ranks.length * 2;

    ranks = ranks.flatMap((rank) => [rank, nextSize + 1 - rank]);
  }

  return ranks;
}

function rotateBracketOrder(order: number[], disciplineIndex: number): number[] {
  if (order.length <= 1) {
    return order;
  }

  const offset = disciplineIndex % order.length;

  return [...order.slice(offset), ...order.slice(0, offset)];
}

function teamSlot(team: ITeam): ITeamSlot {
  return {
    teamId: team._id,
    sets: [],
  };
}

function eventLabel(disciplineName: string, round: number, roundCount: number) {
  if (round === roundCount) {
    return `${disciplineName} Final`;
  }

  return `${disciplineName} Round ${round}`;
}

function createEventMatch(
  disciplineIndex: number,
  disciplineName: string,
  round: number,
  position: number,
  roundCount: number,
): IMatch {
  return {
    _id: new Types.ObjectId(),
    bracket: "winner",
    round,
    position,
    label: eventLabel(disciplineName, round, roundCount),
    placeRange: "",
    format: "bo1",
    teamA: null,
    teamB: null,
    status: "pending",
    winnerId: null,
    loserId: null,
    winnerNextMatchId: null,
    winnerNextSlot: null,
    loserNextMatchId: null,
    loserNextSlot: null,
    isBye: false,
    isWBFinal: round === roundCount,
    isLBFinal: false,
    courtNumber: null,
    eventDisciplineIndex: disciplineIndex,
    eventDisciplineName: disciplineName,
  };
}

function connectWinner(source: IMatch, target: IMatch, slot: Slot) {
  source.winnerNextMatchId = target._id;
  source.winnerNextSlot = slot;
}

function normalizeDisciplineNames(disciplineNames: string[]): string[] {
  return disciplineNames.map((name, index) => {
    const trimmed = name.trim();

    return trimmed.length > 0 ? trimmed : `Discipline ${index + 1}`;
  });
}

function routeWinner(
  matchesById: Map<string, IMatch>,
  match: IMatch,
  winnerId: Types.ObjectId | null,
  nextMatchesReady?: Set<string>,
) {
  if (!match.winnerNextMatchId || !match.winnerNextSlot || !winnerId) {
    return;
  }

  const nextMatch = matchesById.get(match.winnerNextMatchId.toString());

  if (!nextMatch) {
    throw new Error("Generated event bracket points to a missing match");
  }

  nextMatch[match.winnerNextSlot === "A" ? "teamA" : "teamB"] = {
    teamId: winnerId,
    sets: [],
  };

  if (
    nextMatch.status !== "completed" &&
    !nextMatch.isBye &&
    nextMatch.teamA &&
    nextMatch.teamB
  ) {
    nextMatch.status = "ready";
    nextMatchesReady?.add(nextMatch._id.toString());
  }
}

export function generateEventTournamentMatches(
  teams: ITeam[],
  disciplineNames: string[],
  drawSeed = 1,
): IMatch[] {
  const config = deriveEventConfig(teams.length, disciplineNames.length);
  const names = normalizeDisciplineNames(disciplineNames);
  const teamsBySeed = new Map<number, ITeam>();
  const rng = mulberry32(drawSeed);
  const usedPairs = new Set<string>();
  const byePlan = assignEventByes(config);
  const firstRoundMatchCount = config.bracketSize / 2;
  const order = bracketOrder(firstRoundMatchCount);
  const matches: IMatch[] = [];

  teams.forEach((team, index) => {
    team.seed = index + 1;
    teamsBySeed.set(index + 1, team);
  });

  for (
    let disciplineIndex = 0;
    disciplineIndex < config.disciplineCount;
    disciplineIndex += 1
  ) {
    const disciplineName = names[disciplineIndex];
    const byes = byePlan[disciplineIndex];
    const activeSeeds = Array.from(
      { length: config.participantCount },
      (_, index) => index + 1,
    ).filter((seed) => !byes.includes(seed));
    const pairs = pairRoundOne(activeSeeds, usedPairs, rng);
    const entities: FirstRoundEntity[] = [
      ...byes.map((seed) => ({
        firstSeed: seed,
        isBye: true,
        secondSeed: null,
      })),
      ...pairs.map(([firstSeed, secondSeed]) => ({
        firstSeed,
        isBye: false,
        secondSeed,
      })),
    ].sort(
      (first, second) =>
        Math.min(first.firstSeed, first.secondSeed ?? 99) -
        Math.min(second.firstSeed, second.secondSeed ?? 99),
    );
    const firstRoundEntities = Array<FirstRoundEntity>(firstRoundMatchCount);
    const rounds = Array.from({ length: config.roundCount }, (_, roundIndex) =>
      Array.from(
        { length: config.bracketSize / 2 ** (roundIndex + 1) },
        (_value, positionIndex) =>
          createEventMatch(
            disciplineIndex,
            disciplineName,
            roundIndex + 1,
            positionIndex + 1,
            config.roundCount,
          ),
      ),
    );

    const disciplineOrder = rotateBracketOrder(order, disciplineIndex);

    disciplineOrder.forEach((rank, position) => {
      firstRoundEntities[position] = entities[rank - 1];
    });

    for (let roundIndex = 0; roundIndex < config.roundCount - 1; roundIndex += 1) {
      const currentRound = rounds[roundIndex];
      const nextRound = rounds[roundIndex + 1];

      currentRound.forEach((match, index) => {
        connectWinner(
          match,
          nextRound[Math.floor(index / 2)],
          index % 2 === 0 ? "A" : "B",
        );
      });
    }

    rounds[0].forEach((match, index) => {
      const entity = firstRoundEntities[index];
      const firstTeam = teamsBySeed.get(entity.firstSeed);
      const secondTeam = entity.secondSeed
        ? teamsBySeed.get(entity.secondSeed)
        : null;

      if (!firstTeam) {
        throw new Error("Generated event draw references a missing participant");
      }

      match.teamA = teamSlot(firstTeam);
      match.teamB = secondTeam ? teamSlot(secondTeam) : null;

      if (entity.isBye) {
        match.isBye = true;
        match.status = "completed";
        match.winnerId = firstTeam._id;
      } else {
        match.status = "ready";
      }
    });

    const disciplineMatches = rounds.flat();
    const matchesById = new Map(
      disciplineMatches.map((match) => [match._id.toString(), match]),
    );

    for (const match of disciplineMatches) {
      if (match.isBye && match.status === "completed") {
        routeWinner(matchesById, match, match.winnerId);
      }
    }

    matches.push(...disciplineMatches);
  }

  return matches;
}

function eventDisciplineCount(matches: IMatch[]): number {
  const indexes = matches
    .map((match) => match.eventDisciplineIndex)
    .filter((index): index is number => typeof index === "number");

  return indexes.length > 0 ? Math.max(...indexes) + 1 : 1;
}

function isPlayableEventMatch(match: IMatch): boolean {
  return Boolean(
    match.eventDisciplineIndex !== null &&
      match.eventDisciplineIndex !== undefined &&
      !match.isBye &&
      match.status === "ready" &&
      match.teamA &&
      match.teamB &&
      !match.winnerId,
  );
}

function eventMatchIds(match: IMatch) {
  return {
    firstTeamId: match.teamA?.teamId.toString() ?? "",
    matchId: match._id.toString(),
    secondTeamId: match.teamB?.teamId.toString() ?? "",
  };
}

function wouldUnlockNextEventMatch(match: IMatch, matchesById: Map<string, IMatch>): boolean {
  if (!match.winnerNextMatchId || !match.winnerNextSlot) {
    return false;
  }

  const nextMatch = matchesById.get(match.winnerNextMatchId.toString());

  if (!nextMatch || nextMatch.status === "completed" || nextMatch.isBye) {
    return false;
  }

  const targetSlot = match.winnerNextSlot === "A" ? nextMatch.teamA : nextMatch.teamB;
  const otherSlot = match.winnerNextSlot === "A" ? nextMatch.teamB : nextMatch.teamA;

  return !targetSlot && Boolean(otherSlot);
}

function compareEventMatches(first: IMatch, second: IMatch): number {
  return (
    (first.eventDisciplineIndex ?? 0) - (second.eventDisciplineIndex ?? 0) ||
    first.round - second.round ||
    first.position - second.position ||
    first._id.toString().localeCompare(second._id.toString())
  );
}

function scorePlayableEventMatch(
  match: IMatch,
  matchesById: Map<string, IMatch>,
  completedByDiscipline: Map<number, number>,
  maxCompleted: number,
): number {
  const disciplineIndex = match.eventDisciplineIndex ?? 0;
  const completedLag = maxCompleted - (completedByDiscipline.get(disciplineIndex) ?? 0);

  return (
    (wouldUnlockNextEventMatch(match, matchesById) ? 10_000 : 0) +
    completedLag * 100 +
    // Rounds are intentionally only a soft tie-breaker. The scheduler optimizes
    // current tournament flow from the existing graph, not "round 1 before round 2".
    Math.max(0, 32 - match.round)
  );
}

export function planEventSlots(
  matches: IMatch[],
  options: EventSlotPlanOptions = {},
): EventSlotPlan[] {
  let ready = matches.filter(isPlayableEventMatch);
  const matchesById = new Map(matches.map((match) => [match._id.toString(), match]));
  const completedByDiscipline = new Map<number, number>();

  for (const match of matches) {
    if (
      match.eventDisciplineIndex !== null &&
      match.eventDisciplineIndex !== undefined &&
      !match.isBye &&
      match.status === "completed"
    ) {
      const disciplineIndex = match.eventDisciplineIndex;
      completedByDiscipline.set(
        disciplineIndex,
        (completedByDiscipline.get(disciplineIndex) ?? 0) + 1,
      );
    }
  }

  const maxCompleted = Math.max(0, ...completedByDiscipline.values());
  const slots: EventSlotPlan[] = [];
  let slotIndex = 0;

  function sorted(matchesToSort: IMatch[]) {
    return [...matchesToSort].sort((first, second) => {
      const scoreDifference =
        scorePlayableEventMatch(second, matchesById, completedByDiscipline, maxCompleted) -
        scorePlayableEventMatch(first, matchesById, completedByDiscipline, maxCompleted);

      return scoreDifference || compareEventMatches(first, second);
    });
  }

  while (ready.length > 0) {
    const busyParticipants = new Set<string>();
    const busyDisciplines = new Set<number>();
    const slotMatches: IMatch[] = [];
    const selectedMatchIds = new Set<string>();

    const orderedReady =
      slotIndex === 0 && (options.pinnedFirstSlotMatchIds?.length ?? 0) > 0
        ? [
            ...options.pinnedFirstSlotMatchIds!
              .map((matchId) => ready.find((match) => match._id.toString() === matchId))
              .filter((match): match is IMatch => Boolean(match)),
            ...sorted(
              ready.filter(
                (match) => !options.pinnedFirstSlotMatchIds!.includes(match._id.toString()),
              ),
            ),
          ]
        : sorted(ready);

    const rest: IMatch[] = [];

    for (const match of orderedReady) {
      const disciplineIndex = match.eventDisciplineIndex ?? 0;
      const { firstTeamId, matchId, secondTeamId } = eventMatchIds(match);

      if (
        !firstTeamId ||
        !secondTeamId ||
        busyDisciplines.has(disciplineIndex) ||
        busyParticipants.has(firstTeamId) ||
        busyParticipants.has(secondTeamId)
      ) {
        rest.push(match);
        continue;
      }

      slotMatches.push(match);
      selectedMatchIds.add(matchId);
      busyDisciplines.add(disciplineIndex);
      busyParticipants.add(firstTeamId);
      busyParticipants.add(secondTeamId);
    }

    for (const match of ready) {
      if (!selectedMatchIds.has(match._id.toString()) && !rest.includes(match)) {
        rest.push(match);
      }
    }

    slots.push({
      index: slotIndex + 1,
      matches: slotMatches,
    });
    ready = rest;
    slotIndex += 1;
  }

  return slots;
}

function idsEqual(
  first: Types.ObjectId | string,
  second: Types.ObjectId | string,
): boolean {
  return first.toString() === second.toString();
}

function removeCurrentMatch(tournament: ITournament, match: IMatch) {
  tournament.currentMatchIds = tournament.currentMatchIds.filter(
    (matchId) => !idsEqual(matchId, match._id),
  );
}

function clearMatchResult(tournament: ITournament, match: IMatch) {
  match.winnerId = null;
  match.loserId = null;
  match.courtNumber = null;
  match.status = match.teamA && match.teamB ? "ready" : "pending";
  removeCurrentMatch(tournament, match);
}

function matchParticipantSide(match: IMatch, winnerId: Types.ObjectId) {
  if (match.teamA && idsEqual(match.teamA.teamId, winnerId)) {
    return {
      loserId: match.teamB?.teamId ?? null,
      winnerId: match.teamA.teamId,
    };
  }

  if (match.teamB && idsEqual(match.teamB.teamId, winnerId)) {
    return {
      loserId: match.teamA?.teamId ?? null,
      winnerId: match.teamB.teamId,
    };
  }

  return null;
}

export function toggleEventMatchWinner(
  tournament: ITournament,
  match: IMatch,
  requestedWinnerId: Types.ObjectId | string,
): EventWinnerResult {
  if (match.isBye || !match.teamA || !match.teamB) {
    throw new Error("Both participants are required");
  }

  const winnerObjectId =
    requestedWinnerId instanceof Types.ObjectId
      ? requestedWinnerId
      : new Types.ObjectId(requestedWinnerId);
  const participantSide = matchParticipantSide(match, winnerObjectId);

  if (!participantSide || !participantSide.loserId) {
    throw new Error("Winner must be one of the match participants");
  }

  const sameWinnerSelected =
    match.status === "completed" &&
    match.winnerId !== null &&
    idsEqual(match.winnerId, winnerObjectId);
  const affectedMatchIds =
    match.status === "completed"
      ? rollbackCompletedMatch(tournament, match).affectedMatchIds
      : [];

  if (sameWinnerSelected) {
    clearMatchResult(tournament, match);
    tournament.status = "active";

    return {
      affectedMatchIds,
      loserId: null,
      nextMatchesReady: [],
      selected: false,
      tournamentCompleted: false,
      winnerId: null,
    };
  }

  match.winnerId = participantSide.winnerId;
  match.loserId = participantSide.loserId;
  match.status = "completed";
  match.courtNumber = null;
  removeCurrentMatch(tournament, match);

  const nextMatchesReady = new Set<string>();
  const matchesById = new Map(
    tournament.matches.map((candidate) => [candidate._id.toString(), candidate]),
  );

  routeWinner(matchesById, match, participantSide.winnerId, nextMatchesReady);

  const tournamentCompleted = tournament.matches.every(
    (candidate) => candidate.isBye || candidate.status === "completed",
  );

  tournament.status = tournamentCompleted ? "completed" : "active";

  return {
    affectedMatchIds,
    loserId: participantSide.loserId.toString(),
    nextMatchesReady: [...nextMatchesReady],
    selected: true,
    tournamentCompleted,
    winnerId: participantSide.winnerId.toString(),
  };
}
