import { renderToStaticMarkup } from "react-dom/server";
import { StatsTable } from "@/components/stats/StatsTable";
import type { StatsRow } from "@/lib/stats";

const rows: StatsRow[] = [
  {
    name: "Alpha",
    matchesPlayed: 2,
    matchesWon: 1,
    matchesLost: 1,
    setsWon: 3,
    setsLost: 2,
    pointsFor: 45,
    pointsAgainst: 40,
    pointDiff: 5,
    winRate: 0.5,
  },
];

describe("StatsTable", () => {
  it("renders stat columns and formats win rate", () => {
    const markup = renderToStaticMarkup(
      <StatsTable emptyTitle="No team stats" rows={rows} title="Team stats" />,
    );

    expect(markup).toContain("Team stats");
    expect(markup).toContain("Alpha");
    expect(markup).toContain("Played");
    expect(markup).toContain("Points +/-");
    expect(markup).toContain("50%");
  });

  it("keeps the dense desktop table inside a constrained mobile scroller", () => {
    const markup = renderToStaticMarkup(
      <StatsTable emptyTitle="No team stats" rows={rows} title="Team stats" />,
    );

    expect(markup).toContain("overflow-x-auto");
    expect(markup).toContain("max-w-full");
    expect(markup).toContain("min-w-max");
  });

  it("wraps long team or player names instead of clipping them", () => {
    const markup = renderToStaticMarkup(
      <StatsTable
        emptyTitle="No team stats"
        rows={[
          {
            ...rows[0],
            name: "A very long volleyball team name that needs to wrap on mobile screens",
          },
        ]}
        title="Team stats"
      />,
    );

    expect(markup).toContain(
      "A very long volleyball team name that needs to wrap on mobile screens",
    );
    expect(markup).toContain("break-words");
    expect(markup).not.toContain("truncate");
  });

  it("renders an empty state", () => {
    const markup = renderToStaticMarkup(
      <StatsTable emptyTitle="No player stats" rows={[]} title="Player stats" />,
    );

    expect(markup).toContain("No player stats");
  });

  it("renders loading skeleton rows", () => {
    const markup = renderToStaticMarkup(
      <StatsTable
        emptyTitle="No stats"
        isLoading
        rows={[]}
        title="Global stats"
      />,
    );

    expect(markup).toContain("Loading Global stats");
  });
});
