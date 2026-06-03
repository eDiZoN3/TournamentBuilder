import { Types } from "mongoose";
import type { IMatch, ITeam } from "@/lib/models/Tournament";

function createMatch(
  teamA: ITeam,
  teamB: ITeam,
  round: number,
  position: number,
): IMatch {
  return {
    _id: new Types.ObjectId(),
    bracket: "winner",
    round,
    position,
    label: `Round ${round}`,
    placeRange: "",
    format: "bo1",
    teamA: {
      teamId: teamA._id,
      sets: [],
    },
    teamB: {
      teamId: teamB._id,
      sets: [],
    },
    status: "ready",
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
  };
}

export function generateTeamRoundRobinSchedule(teams: ITeam[]): IMatch[] {
  if (teams.length < 2) {
    return [];
  }

  const slots: Array<ITeam | null> =
    teams.length % 2 === 0 ? [...teams] : [...teams, null];
  const rounds = slots.length - 1;
  const matchesPerRound = slots.length / 2;
  const schedule: IMatch[] = [];
  let rotation = [...slots];

  for (let round = 1; round <= rounds; round += 1) {
    let position = 1;

    for (let index = 0; index < matchesPerRound; index += 1) {
      const first = rotation[index];
      const second = rotation[rotation.length - 1 - index];

      if (first && second) {
        schedule.push(createMatch(first, second, round, position));
        position += 1;
      }
    }

    rotation = [
      rotation[0],
      rotation[rotation.length - 1],
      ...rotation.slice(1, rotation.length - 1),
    ];
  }

  return schedule;
}
