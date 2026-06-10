import { describe, expect, it } from "vitest";
import { localizeOrdinal } from "@/lib/i18n";

describe("localizeOrdinal", () => {
  it("returns German dot-suffix ordinals", () => {
    expect(localizeOrdinal(1, "de")).toBe("1.");
    expect(localizeOrdinal(2, "de")).toBe("2.");
    expect(localizeOrdinal(3, "de")).toBe("3.");
    expect(localizeOrdinal(4, "de")).toBe("4.");
    expect(localizeOrdinal(11, "de")).toBe("11.");
    expect(localizeOrdinal(12, "de")).toBe("12.");
  });

  it("returns English suffix ordinals", () => {
    expect(localizeOrdinal(1, "en")).toBe("1st");
    expect(localizeOrdinal(2, "en")).toBe("2nd");
    expect(localizeOrdinal(3, "en")).toBe("3rd");
    expect(localizeOrdinal(4, "en")).toBe("4th");
    expect(localizeOrdinal(11, "en")).toBe("11th");
    expect(localizeOrdinal(12, "en")).toBe("12th");
    expect(localizeOrdinal(13, "en")).toBe("13th");
    expect(localizeOrdinal(21, "en")).toBe("21st");
    expect(localizeOrdinal(22, "en")).toBe("22nd");
  });
});
