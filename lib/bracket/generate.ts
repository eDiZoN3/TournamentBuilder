import { Types } from "mongoose";
import { computeLabel, computePlaceRange } from "@/lib/bracket/labels";
import type {
  FirstRoundPairingMode,
  IMatch,
  ITeam,
  ITeamSlot,
  KnockoutBracketType,
  KnockoutMatchFormat,
} from "@/lib/models/Tournament";

type Slot = "A" | "B";

export interface GenerateBracketOptions {
  firstRoundPairingMode?: FirstRoundPairingMode;
  knockoutBracketType?: KnockoutBracketType;
  knockoutMatchFormat?: KnockoutMatchFormat;
}

function nextPowerOfTwo(value: number): number {
  let result = 1;

  while (result < value) {
    result *= 2;
  }

  return result;
}

function shuffle<T>(values: T[]): T[] {
  const shuffled = [...values];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

function teamSlot(team: ITeam): ITeamSlot {
  return {
    teamId: team._id,
    sets: [],
  };
}

function createMatch(
  bracket: IMatch["bracket"],
  round: number,
  position: number,
): IMatch {
  return {
    _id: new Types.ObjectId(),
    bracket,
    round,
    position,
    label: "",
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
    isWBFinal: false,
    isLBFinal: false,
    courtNumber: null,
    eventDisciplineIndex: null,
    eventDisciplineName: null,
  };
}

function connectWinner(source: IMatch, target: IMatch, slot: Slot) {
  source.winnerNextMatchId = target._id;
  source.winnerNextSlot = slot;
}

function connectLoser(source: IMatch, target: IMatch, slot: Slot) {
  source.loserNextMatchId = target._id;
  source.loserNextSlot = slot;
}

function assignFormatsAndLabels(
  matches: IMatch[],
  totalWBRounds: number,
  teamCount: number,
  bracketSize: number,
  knockoutMatchFormat: KnockoutMatchFormat,
) {
  for (const match of matches) {
    match.format =
      knockoutMatchFormat === "bo1"
        ? "bo1"
        : (match.bracket === "winner" &&
            match.round >= Math.max(1, totalWBRounds - 1)) ||
          match.isLBFinal
        ? "bo3"
        : "bo1";
    match.label = computeLabel(
      match.bracket,
      match.round,
      totalWBRounds,
      match.isWBFinal,
      match.isLBFinal,
    );
    match.placeRange = computePlaceRange(
      match.bracket,
      match.round,
      match.isWBFinal,
      match.isLBFinal,
      teamCount,
      bracketSize,
    );
  }
}

function assignSeededFirstRoundTeams(
  wbR1: IMatch[],
  teams: ITeam[],
  bracketSize: number,
) {
  const seedPositions = generateSeedPositions(bracketSize);

  wbR1.forEach((match, index) => {
    const firstPosition = seedPositions[index];
    const secondPosition = bracketSize + 1 - firstPosition;
    const firstTeam = teams[firstPosition - 1];
    const secondTeam = teams[secondPosition - 1];

    match.teamA = firstTeam ? teamSlot(firstTeam) : null;
    match.teamB = secondTeam ? teamSlot(secondTeam) : null;
  });
}

function assignManualFirstRoundTeams(
  wbR1: IMatch[],
  teams: ITeam[],
  bracketSize: number,
) {
  const byeCount = bracketSize - teams.length;
  const pairedTeamCount = Math.max(0, teams.length - byeCount);
  let teamIndex = 0;

  wbR1.forEach((match) => {
    if (teamIndex < pairedTeamCount) {
      match.teamA = teamSlot(teams[teamIndex]);
      match.teamB = teamSlot(teams[teamIndex + 1]);
      teamIndex += 2;
      return;
    }

    if (teamIndex < teams.length) {
      match.teamA = teamSlot(teams[teamIndex]);
      match.teamB = null;
      teamIndex += 1;
      return;
    }

    match.teamA = null;
    match.teamB = null;
  });
}

function processGeneratedByes(matches: IMatch[], wbR1: IMatch[]) {
  const matchById = new Map(
    matches.map((match) => [match._id.toString(), match]),
  );
  const resolvedSlots = new Map(
    matches.map((match) => [
      match._id.toString(),
      {
        A: false,
        B: false,
      },
    ]),
  );
  const settledMatches = new Set<string>();

  function resolveSlot(match: IMatch, slot: Slot, team: ITeamSlot | null) {
    const resolved = resolvedSlots.get(match._id.toString());

    if (!resolved) {
      throw new Error("Missing generated match slot state");
    }

    resolved[slot] = true;

    if (team) {
      match[slot === "A" ? "teamA" : "teamB"] = team;
    } else {
      match.isBye = true;
    }
  }

  function resolveNext(
    matchId: Types.ObjectId | null,
    slot: Slot | null,
    team: ITeamSlot | null,
  ) {
    if (!matchId || !slot) {
      return;
    }

    const nextMatch = matchById.get(matchId.toString());

    if (!nextMatch) {
      throw new Error("Generated bracket points to a missing match");
    }

    resolveSlot(nextMatch, slot, team);
  }

  for (const match of wbR1) {
    const resolved = resolvedSlots.get(match._id.toString());

    if (!resolved) {
      throw new Error("Missing generated WB R1 slot state");
    }

    resolved.A = true;
    resolved.B = true;
  }

  let foundSettledMatch = true;

  while (foundSettledMatch) {
    foundSettledMatch = false;

    for (const match of matches) {
      const id = match._id.toString();
      const resolved = resolvedSlots.get(id);

      if (
        !resolved ||
        settledMatches.has(id) ||
        !resolved.A ||
        !resolved.B
      ) {
        continue;
      }

      settledMatches.add(id);
      foundSettledMatch = true;

      if (match.teamA && match.teamB) {
        match.status = "ready";
        continue;
      }

      const winner = match.teamA ?? match.teamB;
      match.isBye = true;
      match.status = "completed";
      match.winnerId = winner?.teamId ?? null;
      match.loserId = null;

      resolveNext(match.winnerNextMatchId, match.winnerNextSlot, winner);
      resolveNext(match.loserNextMatchId, match.loserNextSlot, null);
    }
  }
}

export function generateSeedPositions(bracketSize: number): number[] {
  const positions = [1];
  let currentSize = 2;

  while (positions.length < bracketSize / 2) {
    const expanded: number[] = [];

    for (const position of positions) {
      expanded.push(position);
      expanded.push(currentSize + 1 - position);
    }

    positions.splice(0, positions.length, ...expanded);
    currentSize *= 2;
  }

  return positions;
}

export function generateBracket(
  teams: ITeam[],
  courtsAvailable: number,
  options: GenerateBracketOptions = {},
): IMatch[] {
  if (teams.length < 2) {
    throw new Error("At least 2 teams are required");
  }

  if (
    !Number.isInteger(courtsAvailable) ||
    courtsAvailable < 1 ||
    courtsAvailable > 10
  ) {
    throw new Error("Courts available must be between 1 and 10");
  }

  const firstRoundPairingMode = options.firstRoundPairingMode ?? "random";
  const knockoutBracketType = options.knockoutBracketType ?? "double_elimination";
  const knockoutMatchFormat = options.knockoutMatchFormat ?? "bo3_semis_finals";
  const orderedTeams =
    firstRoundPairingMode === "manual" ? [...teams] : shuffle(teams);
  const bracketSize = nextPowerOfTwo(orderedTeams.length);
  const totalWBRounds = Math.log2(bracketSize);
  const matches: IMatch[] = [];
  const wbRounds = new Map<number, IMatch[]>();
  const lbRounds = new Map<number, IMatch[]>();

  orderedTeams.forEach((team, index) => {
    team.seed = index + 1;
  });

  for (let round = 1; round <= totalWBRounds; round += 1) {
    const roundMatches = Array.from(
      {
        length: bracketSize / 2 ** round,
      },
      (_, index) => createMatch("winner", round, index + 1),
    );
    const isFinalRound = round === totalWBRounds;

    roundMatches.forEach((match) => {
      match.isWBFinal = isFinalRound;
    });
    wbRounds.set(round, roundMatches);
    matches.push(...roundMatches);
  }

  const wbR1 = wbRounds.get(1) ?? [];

  if (firstRoundPairingMode === "manual") {
    assignManualFirstRoundTeams(wbR1, orderedTeams, bracketSize);
  } else {
    assignSeededFirstRoundTeams(wbR1, orderedTeams, bracketSize);
  }

  for (let round = 1; round < totalWBRounds; round += 1) {
    const currentRound = wbRounds.get(round) ?? [];
    const nextRound = wbRounds.get(round + 1) ?? [];

    currentRound.forEach((match, index) => {
      connectWinner(
        match,
        nextRound[Math.floor(index / 2)],
        index % 2 === 0 ? "A" : "B",
      );
    });
  }

  if (knockoutBracketType === "double_elimination" && totalWBRounds >= 2) {
    const lbR1 = Array.from(
      {
        length: bracketSize / 4,
      },
      (_, index) => createMatch("loser", 1, index + 1),
    );

    lbRounds.set(1, lbR1);
    matches.push(...lbR1);

    lbR1.forEach((match, index) => {
      connectLoser(wbR1[index], match, "A");
      connectLoser(wbR1[wbR1.length - 1 - index], match, "B");
    });

    let previousLBRound = lbR1;

    for (let wbRound = 2; wbRound < totalWBRounds; wbRound += 1) {
      const wbRoundMatches = wbRounds.get(wbRound) ?? [];
      const feedInRoundNumber = wbRound * 2 - 2;

      if (wbRound > 2) {
        const pureRound = Array.from(
          {
            length: wbRoundMatches.length,
          },
          (_, index) => createMatch("loser", feedInRoundNumber - 1, index + 1),
        );

        pureRound.forEach((match, index) => {
          connectWinner(previousLBRound[index * 2], match, "A");
          connectWinner(previousLBRound[index * 2 + 1], match, "B");
        });
        lbRounds.set(feedInRoundNumber - 1, pureRound);
        matches.push(...pureRound);
        previousLBRound = pureRound;
      }

      const feedInRound = Array.from(
        {
          length: wbRoundMatches.length,
        },
        (_, index) => createMatch("loser", feedInRoundNumber, index + 1),
      );

      feedInRound.forEach((match, index) => {
        connectLoser(
          wbRoundMatches[wbRoundMatches.length - 1 - index],
          match,
          "A",
        );
        connectWinner(previousLBRound[index], match, "B");
      });
      lbRounds.set(feedInRoundNumber, feedInRound);
      matches.push(...feedInRound);
      previousLBRound = feedInRound;
    }

    if (totalWBRounds === 2) {
      lbR1[0].isLBFinal = true;
    } else {
      const finalRoundNumber = totalWBRounds * 2 - 3;
      const lbFinal = createMatch("loser", finalRoundNumber, 1);

      lbFinal.isLBFinal = true;
      connectWinner(previousLBRound[0], lbFinal, "A");
      connectWinner(previousLBRound[1], lbFinal, "B");
      lbRounds.set(finalRoundNumber, [lbFinal]);
      matches.push(lbFinal);
    }
  }

  assignFormatsAndLabels(
    matches,
    totalWBRounds,
    orderedTeams.length,
    bracketSize,
    knockoutMatchFormat,
  );
  processGeneratedByes(matches, wbR1);

  return matches;
}

