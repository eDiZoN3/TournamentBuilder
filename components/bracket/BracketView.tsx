"use client";

import { useRef, useState, type ReactNode } from "react";
import { ConnectorLines } from "@/components/bracket/ConnectorLines";
import { LoserBracket } from "@/components/bracket/LoserBracket";
import { UpNextBanner } from "@/components/bracket/UpNextBanner";
import { WinnerBracket } from "@/components/bracket/WinnerBracket";
import type { IMatch, ITeam } from "@/lib/models/Tournament";

interface BracketViewProps {
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

export function BracketView({
  currentPlayerName = null,
  matches,
  pinnedMatchId = null,
  renderMatchControls,
  teams,
}: BracketViewProps) {
  const [activeBracket, setActiveBracket] = useState<"winner" | "loser">(
    "winner",
  );
  const bracketRef = useRef<HTMLDivElement>(null);
  const hasLoserBracket = matches.some((match) => match.bracket === "loser");
  const hasLargeBracket = teams.length > 8;
  const layoutClasses = [
    "grid min-w-full grid-cols-1 gap-10",
    hasLargeBracket ? "" : "min-[1400px]:grid-cols-2",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className="space-y-6">
      <UpNextBanner matches={matches} teams={teams} />
      {hasLoserBracket ? (
        <div
          aria-label="Bracket selection"
          className="flex rounded-lg bg-slate-100 p-1 md:hidden"
          role="group"
        >
          {(["winner", "loser"] as const).map((bracket) => (
            <button
              aria-pressed={activeBracket === bracket}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold capitalize ${
                activeBracket === bracket
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
              key={bracket}
              onClick={() => setActiveBracket(bracket)}
              type="button"
            >
              {bracket === "winner" ? "Winner" : "Loser"} bracket
            </button>
          ))}
        </div>
      ) : null}
      <div className="relative overflow-x-auto pb-4" ref={bracketRef}>
        <div className={layoutClasses} data-testid="bracket-layout">
          <div
            className={`overflow-x-auto ${
              activeBracket === "winner" ? "block" : "hidden md:block"
            }`}
            data-active={activeBracket === "winner"}
            data-testid="winner-bracket-panel"
          >
            <WinnerBracket
              currentPlayerName={currentPlayerName}
              matches={matches}
              pinnedMatchId={pinnedMatchId}
              renderMatchControls={renderMatchControls}
              teams={teams}
            />
          </div>
          {hasLoserBracket ? (
            <div
              className={`overflow-x-auto ${
                activeBracket === "loser" ? "block" : "hidden md:block"
              }`}
              data-active={activeBracket === "loser"}
              data-testid="loser-bracket-panel"
            >
              <LoserBracket
                currentPlayerName={currentPlayerName}
                matches={matches}
                pinnedMatchId={pinnedMatchId}
                renderMatchControls={renderMatchControls}
                teams={teams}
              />
            </div>
          ) : null}
        </div>
        <ConnectorLines containerRef={bracketRef} matches={matches} />
      </div>
    </section>
  );
}
