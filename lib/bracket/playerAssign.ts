import type { ITeam } from "@/lib/models/Tournament";

export type AssignedTeam = Pick<ITeam, "name" | "players" | "seed">;

function teamSuffix(index: number): string {
  let value = index + 1;
  let suffix = "";

  while (value > 0) {
    const remainder = (value - 1) % 26;
    suffix = String.fromCharCode(65 + remainder) + suffix;
    value = Math.floor((value - 1) / 26);
  }

  return suffix;
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

function normalizeUniquePlayers(players: string[]): string[] {
  const seen = new Set<string>();
  const normalizedPlayers: string[] = [];

  for (const player of players) {
    const normalizedPlayer = player.trim().replace(/\s+/g, " ");
    const key = normalizedPlayer.toLowerCase();

    if (!normalizedPlayer) {
      throw new Error("Player names cannot be empty");
    }

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalizedPlayers.push(normalizedPlayer);
  }

  return normalizedPlayers;
}

export function assignPlayersToTeams(
  players: string[],
  teamSize: 2 | 3 | 4,
): AssignedTeam[] {
  const normalizedPlayers = players.map((player) => player.trim());

  if (normalizedPlayers.some((player) => player.length === 0)) {
    throw new Error("Player names cannot be empty");
  }

  const shuffledPlayers = shuffle(normalizedPlayers);
  const fullTeamCount = Math.floor(shuffledPlayers.length / teamSize);
  const teams: string[][] = [];

  for (let index = 0; index < fullTeamCount; index += 1) {
    teams.push(
      shuffledPlayers.slice(index * teamSize, (index + 1) * teamSize),
    );
  }

  const remainder = shuffledPlayers.slice(fullTeamCount * teamSize);

  if (remainder.length > 0) {
    if (teams.length === 0) {
      teams.push(remainder);
    } else {
      teams[teams.length - 1].push(...remainder);
    }
  }

  if (teams.length === 0 || teams.some((team) => team.length < 2)) {
    throw new Error("Each team must have at least 2 players");
  }

  return teams.map((teamPlayers, index) => ({
    name: `Team ${teamSuffix(index)}`,
    players: teamPlayers,
    seed: 0,
  }));
}

export function assignPlayersToEqualTeams(
  players: string[],
  teamSize: 2 | 3 | 4,
): AssignedTeam[] {
  const normalizedPlayers = normalizeUniquePlayers(players);

  if (normalizedPlayers.length % teamSize !== 0) {
    throw new Error("Player count must be divisible by team size");
  }

  const teamCount = normalizedPlayers.length / teamSize;

  if (teamCount < 2) {
    throw new Error("At least two teams are required");
  }

  const shuffledPlayers = shuffle(normalizedPlayers);

  return Array.from({ length: teamCount }, (_, index) => {
    const teamPlayers = shuffledPlayers.slice(
      index * teamSize,
      (index + 1) * teamSize,
    );

    return {
      name: `Team ${teamSuffix(index)}`,
      players: teamPlayers,
      seed: 0,
    };
  });
}
