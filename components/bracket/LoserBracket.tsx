"use client";

import { useState, type ReactNode } from "react";
import { MatchCard } from "@/components/bracket/MatchCard";
import { RoundTabs } from "@/components/bracket/RoundTabs";
import { resolveTeamName, roundsFor } from "@/components/bracket/utils";
import type { IMatch, ITeam } from "@/lib/models/Tournament";

interface LoserBracketProps {
  matches: IMatch[];
  pinnedMatchId?: string | null;
  renderMatchControls?: (
    match: IMatch,
    teamAName: string,
    teamBName: string,
  ) => ReactNode;
  teams: ITeam[];
}

export function LoserBracket({
  matches,
  pinnedMatchId = null,
  renderMatchControls,
  teams,
}: LoserBracketProps) {
  const rounds = roundsFor(matches, "loser");
  const [activeRound, setActiveRound] = useState(rounds[0]?.[0] ?? 1);
  const roundTabs = rounds.map(([round, roundMatches]) => ({
    label: roundMatches[0]?.label ?? `LB Round ${round}`,
    round,
  }));

  if (rounds.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="loser-bracket-title">
      <h2
        className="mb-4 text-lg font-bold tracking-tight text-slate-900"
        id="loser-bracket-title"
      >
        Loser bracket
      </h2>
      <RoundTabs
        activeRound={activeRound}
        ariaLabel="Loser bracket rounds"
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
                  ? "text-amber-700"
                  : "text-slate-600"
              }`}
            >
              {roundMatches[0]?.label ?? `LB Round ${round}`}
            </h3>
            <div className="flex flex-col gap-6">
              {roundMatches.map((match) => {
                const teamAName =
                  resolveTeamName(teams, match.teamA?.teamId ?? null) ?? "TBD";
                const teamBName =
                  resolveTeamName(teams, match.teamB?.teamId ?? null) ?? "TBD";

                return (
                  <MatchCard
                    isPinned={pinnedMatchId === match._id.toString()}
                    key={match._id.toString()}
                    match={match}
                    teamAName={teamAName}
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
