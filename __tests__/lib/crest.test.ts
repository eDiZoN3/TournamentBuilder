import { describe, expect, it } from "vitest";
import {
  CREST_CHARGES,
  CREST_COLORS,
  CREST_DIVISIONS,
  chargeOutline,
  contrastRatio,
  crestColorHex,
  defaultCrest,
  normalizeCrest,
  resolveCrest,
} from "@/lib/crest";

const validCrest = {
  field: "blue",
  division: "perPale",
  divisionColor: "gold",
  charge: "cross",
  chargeColor: "silver",
};

describe("normalizeCrest", () => {
  it("accepts a fully-formed valid crest", () => {
    expect(normalizeCrest(validCrest)).toEqual(validCrest);
  });

  it("rejects unknown colour / division / charge ids", () => {
    expect(normalizeCrest({ ...validCrest, field: "chartreuse" })).toBeNull();
    expect(normalizeCrest({ ...validCrest, division: "swirl" })).toBeNull();
    expect(normalizeCrest({ ...validCrest, charge: "dragon" })).toBeNull();
  });

  it("rejects non-objects and partial crests", () => {
    expect(normalizeCrest(null)).toBeNull();
    expect(normalizeCrest("blue")).toBeNull();
    expect(normalizeCrest({ field: "blue" })).toBeNull();
  });

  it("drops extra properties, keeping only the crest shape", () => {
    expect(normalizeCrest({ ...validCrest, evil: "payload" })).toEqual(validCrest);
  });

  it("accepts all requested animal charges", () => {
    expect(CREST_CHARGES).toEqual(
      expect.arrayContaining([
        "lion",
        "falcon",
        "puma",
        "panther",
        "lynx",
        "scorpion",
        "cobra",
        "koala",
        "cheetah",
        "jaguar",
        "elephant",
        "ram",
        "fox",
        "hummingbird",
        "leopard",
        "toucan",
      ]),
    );
    expect(normalizeCrest({ ...validCrest, charge: "lion" })).toEqual({
      ...validCrest,
      charge: "lion",
    });
  });
});

describe("contrast helpers", () => {
  it("computes a high ratio for black vs white and low for identical colours", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeGreaterThan(20);
    expect(contrastRatio("#2b2b2b", "#2b2b2b")).toBeCloseTo(1, 5);
  });

  it("outlines a charge only when it is too close to its field", () => {
    // Identical tinctures must get an outline so the charge stays visible.
    expect(chargeOutline("#2b2b2b", "#2b2b2b")).not.toBeNull();
    // High-contrast pairings need none.
    expect(chargeOutline("#2b2b2b", "#d9dde2")).toBeNull();
  });
});

describe("defaultCrest", () => {
  it("is deterministic for a given seed", () => {
    expect(defaultCrest("team-123")).toEqual(defaultCrest("team-123"));
  });

  it("varies across seeds and always uses valid ids", () => {
    for (const seed of ["a", "b", "c", "deadbeef", "65f1c0a9e1"]) {
      const crest = defaultCrest(seed);

      expect(CREST_COLORS.some((c) => c.id === crest.field)).toBe(true);
      expect(CREST_DIVISIONS).toContain(crest.division);
      expect(CREST_CHARGES).toContain(crest.charge);
      // Generated shields always bear a charge.
      expect(crest.charge).not.toBe("none");
    }
  });

  it("always picks a charge tincture that is legible on the field", () => {
    for (let index = 0; index < 200; index += 1) {
      const crest = defaultCrest(`seed-${index}`);
      const ratio = contrastRatio(
        crestColorHex(crest.chargeColor),
        crestColorHex(crest.field),
      );

      expect(ratio).toBeGreaterThanOrEqual(1.8);
    }
  });
});

describe("resolveCrest", () => {
  it("returns the stored crest when valid", () => {
    expect(resolveCrest("seed", validCrest)).toEqual(validCrest);
  });

  it("falls back to a deterministic default when stored data is missing/invalid", () => {
    expect(resolveCrest("seed", null)).toEqual(defaultCrest("seed"));
    expect(resolveCrest("seed", { field: "nope" })).toEqual(defaultCrest("seed"));
  });
});
