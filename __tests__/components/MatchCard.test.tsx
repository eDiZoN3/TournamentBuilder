// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeMatch, makeSet, makeTeams } from "@/__tests__/helpers/factories";
import { MatchCard } from "@/components/bracket/MatchCard";

describe("MatchCard", () => {
  it("renders unresolved pending slots as TBD", () => {
    render(<MatchCard match={makeMatch()} />);

    expect(screen.getAllByText("TBD")).toHaveLength(2);
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.queryByText(/Court/)).not.toBeInTheDocument();
  });

  it("makes team rows clickable winner buttons when onSelectWinner is given", () => {
    const [teamA, teamB] = makeTeams(2);
    const onSelectWinner = vi.fn();

    render(
      <MatchCard
        match={makeMatch({
          status: "in_progress",
          courtNumber: 1,
          teamA: { teamId: teamA._id, sets: [] },
          teamB: { teamId: teamB._id, sets: [] },
        })}
        onSelectWinner={onSelectWinner}
        teamAName="Alpha"
        teamBName="Beta"
      />,
    );

    const teamARow = screen.getByTestId("team-a-row");
    const teamBRow = screen.getByTestId("team-b-row");

    expect(teamARow.tagName).toBe("BUTTON");
    expect(teamBRow.tagName).toBe("BUTTON");

    fireEvent.click(teamBRow);
    expect(onSelectWinner).toHaveBeenCalledWith("B");

    fireEvent.click(teamARow);
    expect(onSelectWinner).toHaveBeenCalledWith("A");
  });

  it("keeps team rows static when no onSelectWinner is provided", () => {
    const [teamA, teamB] = makeTeams(2);

    render(
      <MatchCard
        match={makeMatch({
          status: "in_progress",
          teamA: { teamId: teamA._id, sets: [] },
          teamB: { teamId: teamB._id, sets: [] },
        })}
        teamAName="Alpha"
        teamBName="Beta"
      />,
    );

    expect(screen.getByTestId("team-a-row").tagName).toBe("DIV");
  });

  it("renders a ready match without a court badge", () => {
    const [teamA, teamB] = makeTeams(2);

    render(
      <MatchCard
        match={makeMatch({
          status: "ready",
          teamA: { teamId: teamA._id, sets: [] },
          teamB: { teamId: teamB._id, sets: [] },
        })}
        teamAName="Alpha"
        teamBName="Beta"
      />,
    );

    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.queryByText("LIVE")).not.toBeInTheDocument();
    expect(screen.queryByText(/Court/)).not.toBeInTheDocument();
  });

  it("highlights a live match with amber border (no pulse) and shows its assigned court", () => {
    const [teamA, teamB] = makeTeams(2);

    render(
      <MatchCard
        match={makeMatch({
          status: "in_progress",
          courtNumber: 2,
          teamA: { teamId: teamA._id, sets: [] },
          teamB: { teamId: teamB._id, sets: [] },
        })}
        teamAName="Alpha"
        teamBName="Beta"
      />,
    );

    expect(screen.getByText("LIVE")).toBeInTheDocument();
    expect(screen.getByText("Court 2")).toBeInTheDocument();
    expect(screen.getByTestId("match-card")).not.toHaveClass("animate-pulse");
    expect(screen.getByTestId("match-card")).toHaveClass("border-amber-400");
  });

  it("shows played BO3 sets and emphasizes the completed winner", () => {
    const [teamA, teamB] = makeTeams(2);
    const sets = [makeSet(11, 8), makeSet(9, 11), makeSet(15, 13)];

    render(
      <MatchCard
        match={makeMatch({
          format: "bo3",
          status: "completed",
          winnerId: teamA._id,
          loserId: teamB._id,
          teamA: { teamId: teamA._id, sets },
          teamB: { teamId: teamB._id, sets: [] },
        })}
        teamAName="Alpha"
        teamBName="Beta"
      />,
    );

    expect(screen.getByTestId("team-a-row")).toHaveClass("text-emerald-700");
    expect(screen.getByTestId("team-b-row")).toHaveClass("text-slate-400");
    expect(
      Array.from(screen.getByTestId("team-a-scores").children).map(
        (score) => score.textContent,
      ),
    ).toEqual(["11", "9", "15"]);
    expect(
      Array.from(screen.getByTestId("team-b-scores").children).map(
        (score) => score.textContent,
      ),
    ).toEqual(["8", "11", "13"]);
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("renders byes as completed with the real team first and no scores", () => {
    const [team] = makeTeams(1);

    render(
      <MatchCard
        match={makeMatch({
          status: "completed",
          isBye: true,
          winnerId: team._id,
          teamB: { teamId: team._id, sets: [makeSet(11, 8)] },
        })}
        teamBName="Lucky Team"
      />,
    );

    expect(screen.getByTestId("team-a-row")).toHaveTextContent("Lucky Team");
    expect(screen.getByTestId("team-b-row")).toHaveTextContent("—");
    expect(screen.queryByTestId("team-a-scores")).not.toBeInTheDocument();
    expect(screen.queryByText("LIVE")).not.toBeInTheDocument();
    expect(screen.queryByText(/Court/)).not.toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("hides a stale court number when a match is not live", () => {
    render(
      <MatchCard
        match={makeMatch({
          status: "completed",
          courtNumber: 3,
        })}
      />,
    );

    expect(screen.queryByText("Court 3")).not.toBeInTheDocument();
  });

  it("places optional admin controls below the card on mobile and in a desktop overlay", () => {
    render(
      <MatchCard match={makeMatch()}>
        <button type="button">Admin action</button>
      </MatchCard>,
    );

    expect(screen.getByText("Admin action").parentElement).toHaveClass(
      "md:absolute",
      "md:hidden",
      "md:group-hover:block",
    );
  });

  it("keeps pinned admin controls visible and the card in the foreground", () => {
    render(
      <MatchCard
        isPinned
        match={makeMatch({
          status: "in_progress",
          courtNumber: 1,
        })}
      >
        <button type="button">Admin action</button>
      </MatchCard>,
    );

    const card = screen.getByTestId("match-card");
    const controlsLayer = screen.getByText("Admin action").parentElement;

    expect(card).toHaveClass("z-40", "opacity-100");
    expect(card).not.toHaveClass("opacity-60");
    expect(controlsLayer).toHaveClass("md:absolute", "md:block");
    expect(controlsLayer).not.toHaveClass("md:hidden");
  });

  it("renders WB Round 1 label as Round 1 in English", () => {
    render(<MatchCard match={makeMatch()} />);

    expect(screen.getByText("Round 1")).toBeInTheDocument();
    expect(screen.queryByText("WB Round 1")).not.toBeInTheDocument();
  });

  it("renders WB Semi-Final label as Semi-Final in English", () => {
    render(<MatchCard match={makeMatch({ label: "WB Semi-Final" })} />);

    expect(screen.getByText("Semi-Final")).toBeInTheDocument();
    expect(screen.queryByText("WB Semi-Final")).not.toBeInTheDocument();
  });

  it("renders WB Final label as Final in English", () => {
    render(<MatchCard match={makeMatch({ label: "WB Final", isWBFinal: true })} />);

    expect(screen.getByText("Final")).toBeInTheDocument();
    expect(screen.queryByText("WB Final")).not.toBeInTheDocument();
  });

  it("renders LB Final label retaining the LB prefix in English", () => {
    render(<MatchCard match={makeMatch({ label: "LB Final", isLBFinal: true })} />);

    expect(screen.getByText("LB Final")).toBeInTheDocument();
  });

  it("renders a place range unchanged in English", () => {
    render(
      <MatchCard
        match={makeMatch({ label: "WB Final", isWBFinal: true, placeRange: "1st-2nd Place" })}
      />,
    );

    expect(screen.getByText("1st-2nd Place")).toBeInTheDocument();
  });

  it("pinned live match card has no animate-pulse and retains amber border", () => {
    const [teamA, teamB] = makeTeams(2);

    render(
      <MatchCard
        isPinned
        match={makeMatch({
          status: "in_progress",
          courtNumber: 1,
          teamA: { teamId: teamA._id, sets: [] },
          teamB: { teamId: teamB._id, sets: [] },
        })}
        teamAName="Alpha"
        teamBName="Beta"
      />,
    );

    const card = screen.getByTestId("match-card");

    expect(card).not.toHaveClass("animate-pulse");
    expect(card).toHaveClass("border-amber-400");
  });

  it("live match card has no animate-pulse even when not pinned", () => {
    const [teamA, teamB] = makeTeams(2);

    render(
      <MatchCard
        match={makeMatch({
          status: "in_progress",
          courtNumber: 2,
          teamA: { teamId: teamA._id, sets: [] },
          teamB: { teamId: teamB._id, sets: [] },
        })}
        teamAName="Alpha"
        teamBName="Beta"
      />,
    );

    expect(screen.getByTestId("match-card")).not.toHaveClass("animate-pulse");
    expect(screen.getByTestId("match-card")).toHaveClass("border-amber-400");
  });
});
