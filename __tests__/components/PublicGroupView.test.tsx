// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { Types } from "mongoose";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import type { ITournamentGroup, IGroupCategory } from "@/lib/models/TournamentGroup";
import type { IMatch, ITeam } from "@/lib/models/Tournament";
import { TournamentGroup } from "@/lib/models/TournamentGroup";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const { useSWR } = vi.hoisted(() => ({ useSWR: vi.fn() }));

vi.mock("swr", () => ({ default: useSWR }));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => { throw new Error("NOT_FOUND"); }),
}));

vi.mock("@/components/bracket/BracketView", () => ({
  BracketView: ({
    matches,
    teams,
  }: {
    matches: IMatch[];
    teams: ITeam[];
  }) => (
    <div
      data-testid="bracket-view"
      data-match-count={matches.length}
      data-team-count={teams.length}
    >
      Bracket
    </div>
  ),
}));

vi.mock("@/components/groups/GroupLeaderboard", () => ({
  GroupLeaderboard: ({ group }: { group: ITournamentGroup }) => (
    <div data-testid="group-leaderboard">{group.name}</div>
  ),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeGroup(overrides: Partial<ITournamentGroup> = {}): ITournamentGroup {
  return {
    _id: new Types.ObjectId(),
    name: "Beach Cup",
    status: "active",
    teams: [],
    categories: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as unknown as ITournamentGroup;
}

function makeCategory(name: string, position: number): IGroupCategory {
  return {
    _id: new Types.ObjectId(),
    name,
    position,
    matches: [],
    currentMatchId: null,
  };
}

// ── Server page: groups list ──────────────────────────────────────────────────

describe("public groups list page", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("lists active and completed groups, skips drafts", async () => {
    await TournamentGroup.create({ name: "Active Cup", status: "active" });
    await TournamentGroup.create({ name: "Done Cup", status: "completed" });
    await TournamentGroup.create({ name: "Hidden Cup", status: "draft" });

    const PublicGroupsPage = (await import("@/app/(public)/groups/page")).default;
    const html = renderToStaticMarkup(await PublicGroupsPage());

    expect(html).toContain("Active Cup");
    expect(html).toContain("Done Cup");
    expect(html).not.toContain("Hidden Cup");
  });

  it("shows empty state when no public groups exist", async () => {
    const PublicGroupsPage = (await import("@/app/(public)/groups/page")).default;
    const html = renderToStaticMarkup(await PublicGroupsPage());
    expect(html).toBeDefined();
  });
});

// ── Client component: PublicGroupView ─────────────────────────────────────────

describe("PublicGroupView", () => {
  let PublicGroupView: typeof import("@/components/groups/PublicGroupView").PublicGroupView;

  beforeEach(async () => {
    useSWR.mockImplementation(
      (_key: string, _fetcher: unknown, options: { fallbackData: ITournamentGroup }) => ({
        data: options.fallbackData,
        mutate: vi.fn(),
      }),
    );
    ({ PublicGroupView } = await import("@/components/groups/PublicGroupView"));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("renders one BracketView per category", () => {
    const group = makeGroup({
      categories: [
        makeCategory("Cat A", 0) as never,
        makeCategory("Cat B", 1) as never,
      ],
    });
    render(<PublicGroupView initialGroup={group} />);

    expect(screen.getAllByTestId("bracket-view")).toHaveLength(2);
  });

  it("renders category section headings", () => {
    const group = makeGroup({
      categories: [makeCategory("Mens", 0) as never, makeCategory("Womens", 1) as never],
    });
    render(<PublicGroupView initialGroup={group} />);

    expect(screen.getByText("Mens")).toBeInTheDocument();
    expect(screen.getByText("Womens")).toBeInTheDocument();
  });

  it("passes category matches and group teams to BracketView", () => {
    const matchId = new Types.ObjectId();
    const cat: IGroupCategory = {
      ...makeCategory("Cat A", 0),
      matches: [
        {
          _id: matchId,
          status: "pending",
          bracket: "winner",
          round: 1,
          position: 1,
          label: "",
          placeRange: "",
          format: "bo1",
          teamA: null,
          teamB: null,
          winnerId: null,
          loserId: null,
          winnerNextMatchId: null,
          winnerNextSlot: null,
          loserNextMatchId: null,
          loserNextSlot: null,
          isBye: false,
          isWBFinal: false,
          isLBFinal: false,
          courtNumber: null,
        } as never,
      ],
    };
    const group = makeGroup({ categories: [cat as never] });
    render(<PublicGroupView initialGroup={group} />);

    const bracketView = screen.getByTestId("bracket-view");
    expect(bracketView.dataset.matchCount).toBe("1");
  });

  it("shows GroupLeaderboard when group is completed", () => {
    const group = makeGroup({ name: "Beach Cup", status: "completed" });
    render(<PublicGroupView initialGroup={group} />);

    expect(screen.getByTestId("group-leaderboard")).toBeInTheDocument();
  });

  it("hides category brackets when group is draft", () => {
    const group = makeGroup({
      status: "draft",
      categories: [makeCategory("Cat A", 0) as never],
    });
    render(<PublicGroupView initialGroup={group} />);

    expect(screen.queryAllByTestId("bracket-view")).toHaveLength(0);
  });

  it("SWR refreshInterval stops polling when group is completed", () => {
    const group = makeGroup({ status: "active" });
    render(<PublicGroupView initialGroup={group} />);

    const [, , options] = useSWR.mock.calls[0];
    expect(typeof options.refreshInterval).toBe("function");
    expect(options.refreshInterval({ status: "completed" })).toBe(0);
    expect(options.refreshInterval({ status: "active" })).toBe(5000);
  });
});
