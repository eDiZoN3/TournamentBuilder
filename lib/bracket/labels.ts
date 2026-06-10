import { translate, type Locale } from "@/lib/i18n";
import type { IMatch } from "@/lib/models/Tournament";

type Bracket = IMatch["bracket"];

function ordinal(place: number): string {
  const remainder100 = place % 100;

  if (remainder100 >= 11 && remainder100 <= 13) {
    return `${place}th`;
  }

  switch (place % 10) {
    case 1:
      return `${place}st`;
    case 2:
      return `${place}nd`;
    case 3:
      return `${place}rd`;
    default:
      return `${place}th`;
  }
}

function formatRange(first: number, last: number): string {
  return first === last
    ? `${ordinal(first)} Place`
    : `${ordinal(first)}-${ordinal(last)} Place`;
}

function loserRoundMatchCount(round: number, bracketSize: number): number {
  if (round === 1) {
    return bracketSize / 4;
  }

  return bracketSize / 2 ** (Math.floor((round + 1) / 2) + 1);
}

export function computeLabel(
  bracket: Bracket,
  round: number,
  totalWBRounds: number,
  isWBFinal: boolean,
  isLBFinal: boolean,
): string {
  if (isWBFinal) {
    return "WB Final";
  }

  if (isLBFinal) {
    return "LB Final";
  }

  if (bracket === "winner") {
    if (round === totalWBRounds - 1) {
      return "WB Semi-Final";
    }

    if (round === totalWBRounds - 2) {
      return "WB Quarter-Final";
    }

    return `WB Round ${round}`;
  }

  const totalLBRounds = Math.max(1, totalWBRounds * 2 - 3);

  return round === totalLBRounds - 1 ? "LB Semi-Final" : `LB Round ${round}`;
}

export function localizeLabel(label: string, locale: Locale): string {
  if (/^lb final$/i.test(label.trim())) {
    return translate(locale, "lbFinal");
  }

  if (/semi/i.test(label)) {
    return translate(locale, "semiFinal");
  }

  if (/quarter/i.test(label)) {
    return translate(locale, "quarterFinal");
  }

  if (/final/i.test(label)) {
    return translate(locale, "final");
  }

  const roundMatch = /round\s+(\d+)/i.exec(label);

  if (roundMatch) {
    return `${translate(locale, "round")} ${roundMatch[1]}`;
  }

  return label;
}

export function localizePlaceRange(placeRange: string, locale: Locale): string {
  if (!placeRange || locale === "en") {
    return placeRange;
  }

  const rangeMatch = /^(\d+)(?:st|nd|rd|th)-(\d+)(?:st|nd|rd|th)\s+Place$/i.exec(placeRange);

  if (rangeMatch) {
    return `${rangeMatch[1]}.-${rangeMatch[2]}. Platz`;
  }

  const singleMatch = /^(\d+)(?:st|nd|rd|th)\s+Place$/i.exec(placeRange);

  if (singleMatch) {
    return `${singleMatch[1]}. Platz`;
  }

  return placeRange;
}

export function computePlaceRange(
  bracket: Bracket,
  round: number,
  isWBFinal: boolean,
  isLBFinal: boolean,
  teamCount: number,
  bracketSize: number,
): string {
  if (isWBFinal) {
    return "1st-2nd Place";
  }

  if (isLBFinal) {
    return teamCount === 3 ? "3rd Place" : "3rd-4th Place";
  }

  if (bracket === "winner") {
    return "";
  }

  let eliminatedBefore = 0;

  for (let currentRound = 1; currentRound < round; currentRound += 1) {
    eliminatedBefore += loserRoundMatchCount(currentRound, bracketSize);
  }

  const eliminatedThisRound = loserRoundMatchCount(round, bracketSize);
  const lastPlace = teamCount - eliminatedBefore;
  const firstPlace = Math.max(5, lastPlace - eliminatedThisRound + 1);

  return firstPlace <= lastPlace ? formatRange(firstPlace, lastPlace) : "";
}
