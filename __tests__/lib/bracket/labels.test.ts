import { computeLabel, computePlaceRange, localizeLabel, localizePlaceRange } from "@/lib/bracket/labels";

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

  it.each([
    ["3-team", 2, 1],
    ["4-team", 2, 1],
    ["8-team", 3, 1],
    ["16-team", 4, 1],
  ])(
    "keeps non-final %s opening rounds as numbered labels",
    (_label, totalWBRounds, openingRound) => {
      expect(
        computeLabel("winner", openingRound, totalWBRounds, false, false),
      ).not.toBe("WB Final");
      expect(
        computeLabel("loser", openingRound, totalWBRounds, false, false),
      ).not.toBe("LB Final");
    },
  );
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

describe("localizeLabel", () => {
  it("strips the WB prefix from winner bracket rounds in English", () => {
    expect(localizeLabel("WB Round 1", "en")).toBe("Round 1");
    expect(localizeLabel("WB Round 3", "en")).toBe("Round 3");
  });

  it("strips the LB prefix from loser bracket rounds in English", () => {
    expect(localizeLabel("LB Round 2", "en")).toBe("Round 2");
  });

  it("renders WB Final as Final in English", () => {
    expect(localizeLabel("WB Final", "en")).toBe("Final");
  });

  it("renders LB Final retaining the LB prefix in English", () => {
    expect(localizeLabel("LB Final", "en")).toBe("LB Final");
  });

  it("renders semi-finals without bracket prefix in English", () => {
    expect(localizeLabel("WB Semi-Final", "en")).toBe("Semi-Final");
    expect(localizeLabel("LB Semi-Final", "en")).toBe("Semi-Final");
  });

  it("renders quarter-finals without bracket prefix in English", () => {
    expect(localizeLabel("WB Quarter-Final", "en")).toBe("Quarter-Final");
  });

  it("renders rounds as Runde N in German", () => {
    expect(localizeLabel("WB Round 1", "de")).toBe("Runde 1");
    expect(localizeLabel("LB Round 2", "de")).toBe("Runde 2");
  });

  it("renders WB Final as Finale in German", () => {
    expect(localizeLabel("WB Final", "de")).toBe("Finale");
  });

  it("renders LB Final with German prefix", () => {
    expect(localizeLabel("LB Final", "de")).toBe("LB-Finale");
  });

  it("renders semi-finals as Halbfinale in German", () => {
    expect(localizeLabel("WB Semi-Final", "de")).toBe("Halbfinale");
    expect(localizeLabel("LB Semi-Final", "de")).toBe("Halbfinale");
  });

  it("renders quarter-finals as Viertelfinale in German", () => {
    expect(localizeLabel("WB Quarter-Final", "de")).toBe("Viertelfinale");
  });

  it("passes unknown labels through unchanged for backward compatibility", () => {
    expect(localizeLabel("Custom Label", "en")).toBe("Custom Label");
    expect(localizeLabel("Custom Label", "de")).toBe("Custom Label");
    expect(localizeLabel("", "en")).toBe("");
  });
});

describe("localizePlaceRange", () => {
  it("returns English place ranges unchanged", () => {
    expect(localizePlaceRange("1st-2nd Place", "en")).toBe("1st-2nd Place");
    expect(localizePlaceRange("3rd-4th Place", "en")).toBe("3rd-4th Place");
    expect(localizePlaceRange("3rd Place", "en")).toBe("3rd Place");
    expect(localizePlaceRange("7th-8th Place", "en")).toBe("7th-8th Place");
  });

  it("converts range place ranges to German ordinal format", () => {
    expect(localizePlaceRange("1st-2nd Place", "de")).toBe("1.-2. Platz");
    expect(localizePlaceRange("3rd-4th Place", "de")).toBe("3.-4. Platz");
    expect(localizePlaceRange("7th-8th Place", "de")).toBe("7.-8. Platz");
    expect(localizePlaceRange("13th-16th Place", "de")).toBe("13.-16. Platz");
  });

  it("converts a single-place range to German ordinal format", () => {
    expect(localizePlaceRange("3rd Place", "de")).toBe("3. Platz");
  });

  it("passes empty strings through unchanged", () => {
    expect(localizePlaceRange("", "en")).toBe("");
    expect(localizePlaceRange("", "de")).toBe("");
  });
});
