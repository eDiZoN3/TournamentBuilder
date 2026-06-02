import {
  determineMatchWinner,
  determineSetWinner,
  replaceSet,
  validateSet,
  type SetScore,
} from "@/lib/scoring";

function makeSet(scoreA: number, scoreB: number): SetScore {
  const validation = validateSet(scoreA, scoreB);

  if (!validation.valid) {
    throw new Error(`Invalid test set: ${scoreA}:${scoreB}`);
  }

  return {
    scoreA,
    scoreB,
    pointsToWin: validation.pointsToWin,
  };
}

describe("validateSet", () => {
  it.each([
    [11, 9, 11],
    [15, 13, 11],
    [12, 10, 11],
    [20, 18, 11],
    [21, 19, 21],
    [23, 21, 21],
    [25, 23, 21],
    [22, 20, 21],
    [1_000_000, 999_998, 21],
  ] as const)(
    "accepts %i:%i as a %i-point set",
    (scoreA, scoreB, pointsToWin) => {
      expect(validateSet(scoreA, scoreB)).toEqual({
        valid: true,
        pointsToWin,
      });
    },
  );

  it.each([
    [11.5, 9, "Scores must be integers"],
    ["abc", 9, "Scores must be integers"],
    [-1, 11, "Scores must be non-negative"],
    [11, 11, "Scores cannot be tied"],
    [0, 0, "Scores cannot be tied"],
    [11, 10, "Winner must lead by at least 2 points"],
    [21, 20, "Winner must lead by at least 2 points"],
    [10, 8, "Score too low - minimum winning score is 11"],
    [9, 7, "Score too low - minimum winning score is 11"],
  ] as const)("rejects %s:%s", (scoreA, scoreB, error) => {
    expect(validateSet(scoreA as number, scoreB)).toEqual({
      valid: false,
      error,
    });
  });
});

describe("determineSetWinner", () => {
  it("returns A when team A has more points", () => {
    expect(determineSetWinner(11, 9)).toBe("A");
  });

  it("returns B when team B has more points", () => {
    expect(determineSetWinner(9, 11)).toBe("B");
  });
});

describe("determineMatchWinner", () => {
  it("returns null before a BO1 set has been played", () => {
    expect(determineMatchWinner([], "bo1")).toBeNull();
  });

  it("returns the BO1 set winner", () => {
    expect(determineMatchWinner([makeSet(11, 9)], "bo1")).toBe("A");
    expect(determineMatchWinner([makeSet(9, 11)], "bo1")).toBe("B");
  });

  it("returns null if a BO1 match contains more than one set", () => {
    expect(
      determineMatchWinner([makeSet(11, 9), makeSet(9, 11)], "bo1"),
    ).toBeNull();
  });

  it.each([
    [[makeSet(11, 9), makeSet(11, 8)], "A"],
    [[makeSet(9, 11), makeSet(8, 11)], "B"],
    [[makeSet(11, 9), makeSet(9, 11), makeSet(15, 13)], "A"],
    [[makeSet(11, 9), makeSet(9, 11), makeSet(13, 15)], "B"],
    [[makeSet(11, 9)], null],
    [[makeSet(11, 9), makeSet(9, 11)], null],
    [[], null],
  ] as const)("determines a BO3 match winner", (sets, winner) => {
    expect(determineMatchWinner([...sets], "bo3")).toBe(winner);
  });
});

describe("replaceSet", () => {
  it("appends the next set without clearing earlier results", () => {
    const firstSet = makeSet(11, 9);
    const secondSet = makeSet(8, 11);

    expect(replaceSet([firstSet], 1, secondSet)).toEqual({
      sets: [firstSet, secondSet],
      clearedSets: 0,
    });
  });

  it("clears subsequent sets when an earlier result is re-entered", () => {
    const sets = [makeSet(11, 9), makeSet(8, 11), makeSet(15, 13)];

    const result = replaceSet(sets, 0, makeSet(9, 11));

    expect(result).toEqual({
      sets: [makeSet(9, 11)],
      clearedSets: 2,
    });
  });

  it("rejects skipped set indices", () => {
    expect(() => replaceSet([], 1, makeSet(11, 9))).toThrow(
      "Set index must refer to an existing or next set",
    );
  });
});
