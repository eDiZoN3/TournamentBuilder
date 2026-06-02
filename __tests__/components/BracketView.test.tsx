// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeMatch, makeTeams } from "@/__tests__/helpers/factories";
import { BracketView } from "@/components/bracket/BracketView";
import {
  calculateLines,
  ConnectorLines,
  routesFor,
} from "@/components/bracket/ConnectorLines";

class ResizeObserverMock {
  observe = vi.fn();
  disconnect = vi.fn();
}

describe("ConnectorLines", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  });

  it("draws highlighted winner and loser routes from a live match", async () => {
    const winnerTarget = makeMatch();
    const loserTarget = makeMatch({ bracket: "loser" });
    const source = makeMatch({
      status: "in_progress",
      winnerNextMatchId: winnerTarget._id,
      loserNextMatchId: loserTarget._id,
    });

    function ConnectorHarness() {
      const containerRef = useRef<HTMLDivElement>(null);

      return (
        <div ref={containerRef}>
          <div id={`match-${source._id.toString()}`} />
          <div id={`match-${winnerTarget._id.toString()}`} />
          <div id={`match-${loserTarget._id.toString()}`} />
          <ConnectorLines
            containerRef={containerRef}
            matches={[source, winnerTarget, loserTarget]}
          />
        </div>
      );
    }

    render(<ConnectorHarness />);

    const sourceElement = document.getElementById(`match-${source._id.toString()}`);

    expect(routesFor([source, winnerTarget, loserTarget])).toHaveLength(2);
    expect(
      calculateLines(
        sourceElement?.parentElement as HTMLElement,
        routesFor([source, winnerTarget, loserTarget]),
      ),
    ).toHaveLength(2);
    await waitFor(() => {
      expect(screen.getAllByTestId("connector-line")).toHaveLength(2);
    });
    screen.getAllByTestId("connector-line").forEach((line) => {
      expect(line).toHaveClass("stroke-amber-400");
    });
  });

  it("ignores routes whose target card is not rendered", async () => {
    const target = makeMatch();
    const source = makeMatch({
      winnerNextMatchId: target._id,
    });

    function ConnectorHarness() {
      const containerRef = useRef<HTMLDivElement>(null);

      return (
        <div ref={containerRef}>
          <div id={`match-${source._id.toString()}`} />
          <ConnectorLines containerRef={containerRef} matches={[source]} />
        </div>
      );
    }

    render(<ConnectorHarness />);

    await waitFor(() => {
      expect(screen.queryByTestId("connector-line")).not.toBeInTheDocument();
    });
  });
});

describe("BracketView", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  });

  it("combines both brackets, connectors, and the Up Next banner", () => {
    const teams = makeTeams(4);
    const winnerTarget = makeMatch({
      round: 2,
      label: "WB Final",
    });
    const loserTarget = makeMatch({
      bracket: "loser",
      label: "LB Final",
      isLBFinal: true,
    });
    const readyMatch = makeMatch({
      status: "ready",
      teamA: { teamId: teams[0]._id, sets: [] },
      teamB: { teamId: teams[1]._id, sets: [] },
      winnerNextMatchId: winnerTarget._id,
      loserNextMatchId: loserTarget._id,
    });

    render(
      <BracketView
        matches={[readyMatch, winnerTarget, loserTarget]}
        teams={teams}
      />,
    );

    expect(screen.getByText("Up next")).toBeInTheDocument();
    expect(screen.getByTestId("winner-bracket-panel")).toBeInTheDocument();
    expect(screen.getByTestId("loser-bracket-panel")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Winner bracket" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("switches the active mobile bracket tab", () => {
    const matches = [
      makeMatch(),
      makeMatch({ bracket: "loser", label: "LB Final", isLBFinal: true }),
    ];

    render(<BracketView matches={matches} teams={[]} />);

    fireEvent.click(screen.getByRole("button", { name: "Loser bracket" }));

    expect(
      screen.getByRole("button", { name: "Loser bracket" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("loser-bracket-panel")).toHaveAttribute(
      "data-active",
      "true",
    );
  });

  it("hides loser-bracket controls when a two-team bracket has no LB matches", () => {
    render(<BracketView matches={[makeMatch()]} teams={[]} />);

    expect(
      screen.queryByRole("button", { name: "Loser bracket" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("loser-bracket-panel")).not.toBeInTheDocument();
  });
});
