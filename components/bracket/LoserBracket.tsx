"use client";

import { useState, type ReactNode } from "react";
import { MatchCard } from "@/components/bracket/MatchCard";
import { RoundTabs } from "@/components/bracket/RoundTabs";
import { resolveTeamName, roundsFor } from "@/components/bracket/utils";
import { useLocale } from "@/components/ui/LocaleProvider";
import type { IMatch, ITeam } from "@/lib/models/Tournament";

interface LoserBracketProps {
  currentPlayerName?: string | null;
  matches: IMatch[];
  pinnedMatchId?: string | null;
  renderMatchControls?: (
    match: IMatch,
    teamAName: string,
    teamBName: string,
  ) => ReactNode;
  teams: ITeam[];
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function teamIncludesPlayer(
  teams: ITeam[],
  teamId: IMatch["winnerId"] | null | undefined,
  currentPlayerName?: string | null,
): boolean {
  if (!teamId || !currentPlayerName) {
    return false;
  }

  const playerName = normalizeName(currentPlayerName);
  const team = teams.find((entry) => entry._id.toString() === teamId.toString());

  return Boolean(
    team?.players.some((player) => normalizeName(player) === playerName),
  );
}

export function LoserBracket({
  currentPlayerName = null,
  matches,
  pinnedMatchId = null,
  renderMatchControls,
  teams,
}: LoserBracketProps) {
  const { t } = useLocale();
  const rounds = roundsFor(matches, "loser");
  const [activeRound, setActiveRound] = useState(rounds[0]?.[0] ?? 1);
  const roundTabs = rounds.map(([round, roundMatches]) => ({
    label: roundMatches.some((match) => match.isLBFinal)
      ? rounds.length > 2
        ? t("lbFinal")
        : t("final")
      : `${t("round")} ${round}`,
    round,
  }));

  if (rounds.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="loser-bracket-title">
      <h2
        className="mb-4 text-lg font-bold tracking-tight text-slate-900 dark:text-white"
        id="loser-bracket-title"
      >
        {t("loserBracket")}
      </h2>
      <RoundTabs
        activeRound={activeRound}
        ariaLabel={t("loserBracketRounds")}
        onChange={setActiveRound}
        rounds={roundTabs}
      />
      <div className="flex min-w-max gap-8">
        {rounds.map(([round, roundMatches]) => (
          <section
            className={`w-64 shrink-0 ${
              activeRound === round ? "block" : "hidden md:block"
            }`}
            data-active={activeRound === round}
            data-testid="loser-round"
            key={round}
          >
            <h3
              className={`mb-3 text-sm font-semibold ${
                roundMatches.some((match) => match.isLBFinal)
                  ? "text-amber-700 dark:text-amber-300"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              {roundMatches[0]?.label ?? `${t("loserBracket")} ${t("round")} ${round}`}
            </h3>
            <div className="flex flex-col gap-6">
              {roundMatches.map((match) => {
                const teamAName =
                  resolveTeamName(teams, match.teamA?.teamId ?? null) ?? t("toBeDetermined");
                const teamBName =
                  resolveTeamName(teams, match.teamB?.teamId ?? null) ?? t("toBeDetermined");

                return (
                  <MatchCard
                    isPinned={pinnedMatchId === match._id.toString()}
                    key={match._id.toString()}
                    match={match}
                    teamAIsCurrentPlayerTeam={teamIncludesPlayer(
                      teams,
                      match.teamA?.teamId,
                      currentPlayerName,
                    )}
                    teamAName={teamAName}
                    teamBIsCurrentPlayerTeam={teamIncludesPlayer(
                      teams,
                      match.teamB?.teamId,
                      currentPlayerName,
                    )}
                    teamBName={teamBName}
                  >
                    {renderMatchControls?.(match, teamAName, teamBName)}
                  </MatchCard>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
