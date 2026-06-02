import { MatchCard } from "@/components/bracket/MatchCard";
import { resolveTeamName, roundsFor } from "@/components/bracket/utils";
import type { IMatch, ITeam } from "@/lib/models/Tournament";

interface WinnerBracketProps {
  matches: IMatch[];
  teams: ITeam[];
}

export function WinnerBracket({ matches, teams }: WinnerBracketProps) {
  const rounds = roundsFor(matches, "winner");

  return (
    <section aria-labelledby="winner-bracket-title">
      <h2
        className="mb-4 text-lg font-bold tracking-tight text-slate-900"
        id="winner-bracket-title"
      >
        Winner bracket
      </h2>
      <div className="flex min-w-max gap-8">
        {rounds.map(([round, roundMatches], roundIndex) => (
          <section
            className="w-64 shrink-0"
            data-testid="winner-round"
            key={round}
          >
            <h3 className="mb-3 text-sm font-semibold text-slate-600">
              {roundMatches[0]?.label ?? `WB Round ${round}`}
            </h3>
            <div
              className="flex flex-col"
              style={{
                gap: `${Math.max(1.5, 1.5 * 2 ** roundIndex)}rem`,
                paddingTop: `${roundIndex * 1.5}rem`,
              }}
            >
              {roundMatches.map((match) => (
                <MatchCard
                  key={match._id.toString()}
                  match={match}
                  teamAName={resolveTeamName(teams, match.teamA?.teamId ?? null)}
                  teamBName={resolveTeamName(teams, match.teamB?.teamId ?? null)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
