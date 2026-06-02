export type MatchFormat = "bo1" | "bo3";
export type TeamSide = "A" | "B";

export type SetValidation =
  | {
      valid: true;
      pointsToWin: 11 | 21;
    }
  | {
      valid: false;
      error: string;
    };

export interface SetScore {
  scoreA: number;
  scoreB: number;
  pointsToWin: 11 | 21;
}

export interface SetReplacement {
  sets: SetScore[];
  clearedSets: number;
}

export function validateSet(scoreA: number, scoreB: number): SetValidation {
  if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB)) {
    return {
      valid: false,
      error: "Scores must be integers",
    };
  }

  if (scoreA < 0 || scoreB < 0) {
    return {
      valid: false,
      error: "Scores must be non-negative",
    };
  }

  if (scoreA === scoreB) {
    return {
      valid: false,
      error: "Scores cannot be tied",
    };
  }

  const winner = Math.max(scoreA, scoreB);
  const loser = Math.min(scoreA, scoreB);

  if (winner - loser < 2) {
    return {
      valid: false,
      error: "Winner must lead by at least 2 points",
    };
  }

  if (winner >= 21) {
    return {
      valid: true,
      pointsToWin: 21,
    };
  }

  if (winner >= 11) {
    return {
      valid: true,
      pointsToWin: 11,
    };
  }

  return {
    valid: false,
    error: "Score too low - minimum winning score is 11",
  };
}

export function determineSetWinner(scoreA: number, scoreB: number): TeamSide {
  return scoreA > scoreB ? "A" : "B";
}

export function determineMatchWinner(
  sets: SetScore[],
  format: MatchFormat,
): TeamSide | null {
  if (format === "bo1") {
    return sets.length === 1
      ? determineSetWinner(sets[0].scoreA, sets[0].scoreB)
      : null;
  }

  const winsA = sets.filter((set) => set.scoreA > set.scoreB).length;
  const winsB = sets.filter((set) => set.scoreB > set.scoreA).length;

  if (winsA === 2) {
    return "A";
  }

  if (winsB === 2) {
    return "B";
  }

  return null;
}

export function replaceSet(
  sets: SetScore[],
  setIndex: number,
  set: SetScore,
): SetReplacement {
  if (!Number.isInteger(setIndex) || setIndex < 0 || setIndex > sets.length) {
    throw new RangeError("Set index must refer to an existing or next set");
  }

  return {
    sets: [...sets.slice(0, setIndex), set],
    clearedSets: Math.max(sets.length - setIndex - 1, 0),
  };
}

