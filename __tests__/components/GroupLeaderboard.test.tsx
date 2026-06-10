// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { Types } from "mongoose";
import { describe, expect, it, vi } from "vitest";
import type { ITournamentGroup } from "@/lib/models/TournamentGroup";
import type { LeaderboardRow } from "@/lib/groups/leaderboard";

vi.mock("@/lib/groups/leaderboard", () => ({
  computeLeaderboard: vi.fn(() => [] as LeaderboardRow[]),
}));

function makeGroup(overrides: Partial<ITournamentGroup> = {}): ITournamentGroup {
  return {
    _id: new Types.ObjectId(),
    name: "Test Group",
    status: "completed",
    teams: [],
    categories: [
      { _id: new Types.ObjectId(), name: "Cat A", position: 0, matches: [], currentMatchId: null },
      { _id: new Types.ObjectId(), name: "Cat B", position: 1, matches: [], currentMatchId: null },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as unknown as ITournamentGroup;
}

function makeRow(overrides: Partial<LeaderboardRow> = {}): LeaderboardRow {
  return {
    teamId: new Types.ObjectId().toString(),
    teamName: "Team X",
    totalScore: 3,
    totalWins: 1,
    placements: [1, 2],
    ...overrides,
  };
}

describe("GroupLeaderboard", () => {
  it("renders category names as column headers", async () => {
    const { computeLeaderboard } = await import("@/lib/groups/leaderboard");
    vi.mocked(computeLeaderboard).mockReturnValue([makeRow()]);

    const { GroupLeaderboard } = await import("@/components/groups/GroupLeaderboard");
    const group = makeGroup();
    render(<GroupLeaderboard group={group} />);

    expect(screen.getByText("Cat A")).toBeInTheDocument();
    expect(screen.getByText("Cat B")).toBeInTheDocument();
  });

  it("renders team names in rank order", async () => {
    const { computeLeaderboard } = await import("@/lib/groups/leaderboard");
    vi.mocked(computeLeaderboard).mockReturnValue([
      makeRow({ teamName: "Alpha", totalScore: 2, placements: [1, 1] }),
      makeRow({ teamName: "Beta", totalScore: 3, placements: [2, 1] }),
    ]);

    const { GroupLeaderboard } = await import("@/components/groups/GroupLeaderboard");
    render(<GroupLeaderboard group={makeGroup()} />);

    const rows = screen.getAllByRole("row");
    // rows[0] = header, rows[1] = rank 1, rows[2] = rank 2
    expect(rows[1]).toHaveTextContent("Alpha");
    expect(rows[2]).toHaveTextContent("Beta");
  });

  it("renders ordinal placements (1st, 2nd, 3rd, 4th) in category columns", async () => {
    const { computeLeaderboard } = await import("@/lib/groups/leaderboard");
    vi.mocked(computeLeaderboard).mockReturnValue([
      makeRow({ teamName: "Alpha", placements: [1, 3] }),
      makeRow({ teamName: "Beta", placements: [2, 4] }),
    ]);

    const { GroupLeaderboard } = await import("@/components/groups/GroupLeaderboard");
    render(<GroupLeaderboard group={makeGroup()} />);

    expect(screen.getByText("1st")).toBeInTheDocument();
    expect(screen.getByText("3rd")).toBeInTheDocument();
    expect(screen.getByText("2nd")).toBeInTheDocument();
    expect(screen.getByText("4th")).toBeInTheDocument();
  });

  it("renders total score for each row", async () => {
    const { computeLeaderboard } = await import("@/lib/groups/leaderboard");
    vi.mocked(computeLeaderboard).mockReturnValue([
      makeRow({ teamName: "Alpha", totalScore: 3, placements: [1, 2] }),
    ]);

    const { GroupLeaderboard } = await import("@/components/groups/GroupLeaderboard");
    render(<GroupLeaderboard group={makeGroup()} />);

    // Total score column header
    expect(screen.getByText(/total score/i)).toBeInTheDocument();
    // Total score value
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("assigns rank 1 to first row, rank 2 to second with different score", async () => {
    const { computeLeaderboard } = await import("@/lib/groups/leaderboard");
    vi.mocked(computeLeaderboard).mockReturnValue([
      makeRow({ teamName: "Alpha", totalScore: 2 }),
      makeRow({ teamName: "Beta", totalScore: 4 }),
    ]);

    const { GroupLeaderboard } = await import("@/components/groups/GroupLeaderboard");
    render(<GroupLeaderboard group={makeGroup()} />);

    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("1");
    expect(rows[2]).toHaveTextContent("2");
  });

  it("tied teams (same totalScore) share the same rank number", async () => {
    const { computeLeaderboard } = await import("@/lib/groups/leaderboard");
    vi.mocked(computeLeaderboard).mockReturnValue([
      makeRow({ teamName: "Alpha", totalScore: 3 }),
      makeRow({ teamName: "Beta", totalScore: 3 }),
    ]);

    const { GroupLeaderboard } = await import("@/components/groups/GroupLeaderboard");
    render(<GroupLeaderboard group={makeGroup()} />);

    const rows = screen.getAllByRole("row");
    // Both should display rank 1
    expect(rows[1]).toHaveTextContent("1");
    expect(rows[2]).toHaveTextContent("1");
  });

  it("renders Rank and Team column headers", async () => {
    const { computeLeaderboard } = await import("@/lib/groups/leaderboard");
    vi.mocked(computeLeaderboard).mockReturnValue([makeRow()]);

    const { GroupLeaderboard } = await import("@/components/groups/GroupLeaderboard");
    render(<GroupLeaderboard group={makeGroup()} />);

    expect(screen.getByText(/rank/i)).toBeInTheDocument();
    expect(screen.getByText(/^team$/i)).toBeInTheDocument();
  });

  it("renders nothing when group status is draft", async () => {
    const { GroupLeaderboard } = await import("@/components/groups/GroupLeaderboard");
    const group = makeGroup({ status: "draft" });
    const { container } = render(<GroupLeaderboard group={group} />);

    expect(container.firstChild).toBeNull();
  });

  it("renders the leaderboard when group status is active", async () => {
    const { computeLeaderboard } = await import("@/lib/groups/leaderboard");
    vi.mocked(computeLeaderboard).mockReturnValue([makeRow()]);

    const { GroupLeaderboard } = await import("@/components/groups/GroupLeaderboard");
    const group = makeGroup({ status: "active" });
    render(<GroupLeaderboard group={group} />);

    expect(screen.getByRole("table")).toBeInTheDocument();
  });
});
