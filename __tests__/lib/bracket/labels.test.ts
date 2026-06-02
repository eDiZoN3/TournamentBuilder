import { computeLabel, computePlaceRange } from "@/lib/bracket/labels";

describe("computeLabel", () => {
  it("labels every winner bracket match type", () => {
    expect(computeLabel("winner", 1, 4, false, false)).toBe("WB Round 1");
    expect(computeLabel("winner", 2, 4, false, false)).toBe(
      "WB Quarter-Final",
    );
    expect(computeLabel("winner", 3, 4, false, false)).toBe("WB Semi-Final");
    expect(computeLabel("winner", 4, 4, true, false)).toBe("WB Final");
  });

  it("labels loser bracket rounds, semi-finals, and finals", () => {
    expect(computeLabel("loser", 1, 4, false, false)).toBe("LB Round 1");
    expect(computeLabel("loser", 4, 4, false, false)).toBe("LB Semi-Final");
    expect(computeLabel("loser", 5, 4, false, true)).toBe("LB Final");
  });

  it("labels the 4-team loser bracket match as the final", () => {
    expect(computeLabel("loser", 1, 2, false, true)).toBe("LB Final");
  });
});

describe("computePlaceRange", () => {
  it("returns placement ranges for bracket finals", () => {
    expect(computePlaceRange("winner", 3, true, false, 8, 8)).toBe(
      "1st-2nd Place",
    );
    expect(computePlaceRange("loser", 3, false, true, 8, 8)).toBe(
      "3rd-4th Place",
    );
    expect(computePlaceRange("loser", 1, false, true, 3, 4)).toBe(
      "3rd Place",
    );
  });

  it("leaves non-final winner bracket place ranges empty", () => {
    expect(computePlaceRange("winner", 1, false, false, 8, 8)).toBe("");
  });

  it("computes 8-team loser bracket elimination ranges", () => {
    expect(computePlaceRange("loser", 1, false, false, 8, 8)).toBe(
      "7th-8th Place",
    );
    expect(computePlaceRange("loser", 2, false, false, 8, 8)).toBe(
      "5th-6th Place",
    );
  });

  it("computes 16-team loser bracket elimination ranges", () => {
    expect(computePlaceRange("loser", 1, false, false, 16, 16)).toBe(
      "13th-16th Place",
    );
    expect(computePlaceRange("loser", 2, false, false, 16, 16)).toBe(
      "9th-12th Place",
    );
    expect(computePlaceRange("loser", 3, false, false, 16, 16)).toBe(
      "7th-8th Place",
    );
    expect(computePlaceRange("loser", 4, false, false, 16, 16)).toBe(
      "5th-6th Place",
    );
  });

  it("bases padded bracket ranges on the real team count", () => {
    expect(computePlaceRange("loser", 1, false, false, 6, 8)).toBe(
      "5th-6th Place",
    );
    expect(computePlaceRange("loser", 2, false, false, 6, 8)).toBe("");
  });
});

