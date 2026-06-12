import type { TranslationKey } from "@/lib/i18n";

/**
 * Per-tournament visual themes ("skins").
 *
 * A theme only changes the *look* of a tournament — never its behaviour. Each
 * theme is applied by setting `data-tournament-theme="<id>"` on the wrapper that
 * surrounds a tournament view (see `TournamentManageView` / `PublicTournamentView`).
 * The matching CSS lives in `app/themes/` — one file per theme — so adding a new
 * theme is purely additive:
 *
 *   1. Append an entry to `TOURNAMENT_THEMES` below.
 *   2. Add its label keys to `lib/i18n.ts`.
 *   3. Create `app/themes/<id>.css` and import it from `app/themes/index.css`.
 *
 * No view or API code needs to change to support a new theme.
 */
export interface TournamentThemeDefinition {
  /** Stored on the tournament document and emitted as `data-tournament-theme`. */
  id: string;
  /** i18n key for the human-readable name shown in the theme picker. */
  labelKey: TranslationKey;
  /** i18n key for the short description shown beneath the picker. */
  descriptionKey: TranslationKey;
}

export const TOURNAMENT_THEMES: readonly TournamentThemeDefinition[] = [
  {
    id: "default",
    labelKey: "themeDefault",
    descriptionKey: "themeDefaultDescription",
  },
  {
    id: "knight",
    labelKey: "themeKnight",
    descriptionKey: "themeKnightDescription",
  },
  {
    id: "volleyball",
    labelKey: "themeVolleyball",
    descriptionKey: "themeVolleyballDescription",
  },
  {
    id: "gaming",
    labelKey: "themeGaming",
    descriptionKey: "themeGamingDescription",
  },
] as const;

export type TournamentTheme = (typeof TOURNAMENT_THEMES)[number]["id"];

export const DEFAULT_TOURNAMENT_THEME: TournamentTheme = "default";

export const TOURNAMENT_THEME_IDS: readonly string[] = TOURNAMENT_THEMES.map(
  (theme) => theme.id,
);

export function isTournamentTheme(value: unknown): value is TournamentTheme {
  return typeof value === "string" && TOURNAMENT_THEME_IDS.includes(value);
}

/** Normalises any stored/legacy value to a valid theme id. */
export function resolveTournamentTheme(value: unknown): TournamentTheme {
  return isTournamentTheme(value) ? value : DEFAULT_TOURNAMENT_THEME;
}
