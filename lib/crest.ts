/**
 * Heraldic "coat of arms" model for teams.
 *
 * A crest is purely cosmetic and is only ever *shown* by the knight tournament
 * theme (see `components/bracket/TeamCrest.tsx`). The data, however, lives on
 * the team document regardless of theme so a tournament can switch skins without
 * losing the shields someone designed.
 *
 * Everything here is pure (no React, no DOM) so it can be unit-tested and reused
 * on the server (validation in the API route) and the client (the editor).
 */

/** A heraldic tincture: an id plus the hex it renders as. */
export interface CrestColor {
  id: string;
  hex: string;
}

export const CREST_COLORS: readonly CrestColor[] = [
  { id: "gold", hex: "#caa23a" },
  { id: "silver", hex: "#d9dde2" },
  { id: "red", hex: "#a62a2a" },
  { id: "blue", hex: "#2a4d8f" },
  { id: "green", hex: "#2e7d4f" },
  { id: "black", hex: "#2b2b2b" },
  { id: "purple", hex: "#6a3b8f" },
  { id: "orange", hex: "#c4711f" },
] as const;

/** How the shield's field is divided. */
export const CREST_DIVISIONS: readonly string[] = [
  "plain",
  "perPale",
  "perFess",
  "perBend",
  "quarterly",
  "chief",
  "chevron",
] as const;

/** The central charge (symbol). `none` leaves the field bare. */
export const CREST_CHARGES: readonly string[] = [
  "none",
  "cross",
  "saltire",
  "mullet",
  "lozenge",
  "roundel",
  "crescent",
  "crown",
  "fleur",
  "swords",
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
] as const;

export interface TeamCrest {
  /** Primary field tincture id (see {@link CREST_COLORS}). */
  field: string;
  /** Field division id (see {@link CREST_DIVISIONS}). */
  division: string;
  /** Second tincture used by the division id. */
  divisionColor: string;
  /** Central charge id (see {@link CREST_CHARGES}). */
  charge: string;
  /** Tincture id the charge is drawn in. */
  chargeColor: string;
}

const COLOR_IDS = new Set(CREST_COLORS.map((color) => color.id));
const DIVISION_IDS = new Set(CREST_DIVISIONS);
const CHARGE_IDS = new Set(CREST_CHARGES);

export function isCrestColor(value: unknown): value is string {
  return typeof value === "string" && COLOR_IDS.has(value);
}

export function isCrestDivision(value: unknown): value is string {
  return typeof value === "string" && DIVISION_IDS.has(value);
}

export function isCrestCharge(value: unknown): value is string {
  return typeof value === "string" && CHARGE_IDS.has(value);
}

/** Resolve a tincture id to its hex, falling back to the first colour. */
export function crestColorHex(id: string): string {
  return CREST_COLORS.find((color) => color.id === id)?.hex ?? CREST_COLORS[0].hex;
}

/**
 * Validate an arbitrary value as a crest. Returns a fully-formed crest (so the
 * caller never has to deal with partials) or `null` if anything is invalid.
 */
export function normalizeCrest(value: unknown): TeamCrest | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const { field, division, divisionColor, charge, chargeColor } = value as Record<
    string,
    unknown
  >;

  if (
    !isCrestColor(field) ||
    !isCrestDivision(division) ||
    !isCrestColor(divisionColor) ||
    !isCrestCharge(charge) ||
    !isCrestColor(chargeColor)
  ) {
    return null;
  }

  return { field, division, divisionColor, charge, chargeColor };
}

/* --- Contrast helpers --------------------------------------------------- */

function channelLuminance(channel: number): number {
  const c = channel / 255;

  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance of a `#rrggbb` colour, in [0, 1]. */
export function relativeLuminance(hex: string): number {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);

  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

/** WCAG contrast ratio between two `#rrggbb` colours, in [1, 21]. */
export function contrastRatio(hexA: string, hexB: string): number {
  const a = relativeLuminance(hexA);
  const b = relativeLuminance(hexB);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * An outline colour that keeps a charge visible no matter which tinctures the
 * user picks. When the charge and the field it sits on are too close in
 * lightness (e.g. gold-on-silver, the exact "black on dark brown" class of
 * problem we never want), we ring the charge with a contrasting parchment or
 * ink stroke; otherwise no stroke is needed.
 */
export function chargeOutline(chargeHex: string, fieldHex: string): string | null {
  if (contrastRatio(chargeHex, fieldHex) >= 1.8) {
    return null;
  }

  return relativeLuminance(chargeHex) > 0.5 ? "#241a10" : "#f4ead2";
}

/* --- Defaults ----------------------------------------------------------- */

/** Deterministic 32-bit hash so each team gets a stable, distinct default. */
function hashSeed(seed: string): number {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

/**
 * A stable, reasonably distinct crest derived from a team's id, so every team
 * has a coat of arms before anyone opens the editor. The charge tincture is
 * chosen to contrast the field, so generated shields are always legible.
 */
export function defaultCrest(seed: string): TeamCrest {
  const hash = hashSeed(seed || "team");
  const colorCount = CREST_COLORS.length;
  const fieldIndex = hash % colorCount;
  const field = CREST_COLORS[fieldIndex];
  const divisionColor =
    CREST_COLORS[(fieldIndex + 1 + ((hash >>> 3) % (colorCount - 1))) % colorCount];

  // Pick the charge tincture that contrasts the field most, for legibility.
  let chargeColor = CREST_COLORS[0];
  let bestContrast = 0;

  for (const candidate of CREST_COLORS) {
    const contrast = contrastRatio(candidate.hex, field.hex);

    if (contrast > bestContrast) {
      bestContrast = contrast;
      chargeColor = candidate;
    }
  }

  return {
    field: field.id,
    division: CREST_DIVISIONS[(hash >>> 6) % CREST_DIVISIONS.length],
    divisionColor: divisionColor.id,
    // Always give a generated shield a charge (skip the "none" entry at index 0).
    charge: CREST_CHARGES[1 + ((hash >>> 9) % (CREST_CHARGES.length - 1))],
    chargeColor: chargeColor.id,
  };
}

/** The crest to render for a team: its stored crest, or a generated default. */
export function resolveCrest(seed: string, stored: unknown): TeamCrest {
  return normalizeCrest(stored) ?? defaultCrest(seed);
}
