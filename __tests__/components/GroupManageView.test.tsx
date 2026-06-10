// @vitest-environment jsdom

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { Types } from "mongoose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ITournamentGroup } from "@/lib/models/TournamentGroup";
import type { MatchActivation } from "@/lib/groups/scheduler";
import { LOCALE_STORAGE_KEY } from "@/lib/i18n";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const { useSWR } = vi.hoisted(() => ({ useSWR: vi.fn() }));

vi.mock("swr", () => ({ default: useSWR }));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  notFound: vi.fn(() => { throw new Error("NOT_FOUND"); }),
}));

vi.mock("@/components/admin/ScoreEntry", () => ({
  ScoreEntry: ({ onClose, match }: { onClose: () => void; match: { _id: { toString: () => string } } }) => (
    <div data-testid="score-entry" data-match-id={match._id.toString()}>
      Score modal
      <button type="button" onClick={onClose}>Close score modal</button>
    </div>
  ),
}));

vi.mock("@/components/groups/GroupLeaderboard", () => ({
  GroupLeaderboard: ({ group }: { group: ITournamentGroup }) => (
    <div data-testid="group-leaderboard">{group.name} leaderboard</div>
  ),
}));

vi.mock("@/lib/groups/scheduler", () => ({
  computeNextMatches: vi.fn(() => [] as MatchActivation[]),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeTeamSlot(name: string) {
  return { teamId: new Types.ObjectId(), name, sets: [], seed: 1 };
}

function makeMatch(overrides: Partial<{
  _id: Types.ObjectId;
  status: "pending" | "ready" | "in_progress" | "completed";
  teamA: ReturnType<typeof makeTeamSlot> | null;
  teamB: ReturnType<typeof makeTeamSlot> | null;
  label: string;
}> = {}) {
  return {
    _id: new Types.ObjectId(),
    bracket: "winner" as const,
    round: 1,
    position: 1,
    label: "WB Round 1",
    placeRange: "",
    format: "bo1" as const,
    teamA: null as ReturnType<typeof makeTeamSlot> | null,
    teamB: null as ReturnType<typeof makeTeamSlot> | null,
    status: "pending" as const,
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
    ...overrides,
  };
}

function makeCategory(name: string, position: number, matches: ReturnType<typeof makeMatch>[] = []) {
  return {
    _id: new Types.ObjectId(),
    name,
    position,
    matches,
    currentMatchId: undefined,
  };
}

function makeGroup(overrides: Partial<ITournamentGroup> = {}): ITournamentGroup {
  return {
    _id: new Types.ObjectId(),
    name: "Test Group",
    status: "active",
    teams: [],
    categories: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as unknown as ITournamentGroup;
}

// ── Setup ─────────────────────────────────────────────────────────────────────

const mockedUseRouter = vi.mocked(useRouter);
const push = vi.fn();
const refresh = vi.fn();

beforeEach(async () => {
  push.mockReset();
  refresh.mockReset();
  mockedUseRouter.mockReturnValue({ push, refresh } as never);
  useSWR.mockImplementation(
    (_key: string, _fetcher: unknown, options: { fallbackData: ITournamentGroup }) => ({
      data: options.fallbackData,
      mutate: vi.fn(),
    }),
  );
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.resetModules();
  window.localStorage.removeItem(LOCALE_STORAGE_KEY);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("GroupManageView", () => {
  let GroupManageView: typeof import("@/components/groups/GroupManageView").GroupManageView;

  beforeEach(async () => {
    ({ GroupManageView } = await import("@/components/groups/GroupManageView"));
  });

  it("renders one row per category", () => {
    const group = makeGroup({
      categories: [
        makeCategory("Cat A", 0) as never,
        makeCategory("Cat B", 1) as never,
      ],
    });
    render(<GroupManageView initialGroup={group} />);

    expect(screen.getByText("Cat A")).toBeInTheDocument();
    expect(screen.getByText("Cat B")).toBeInTheDocument();
  });

  it("shows active match with team names and enter scores button", () => {
    const matchId = new Types.ObjectId();
    const activeMatch = makeMatch({
      _id: matchId,
      status: "in_progress",
      teamA: makeTeamSlot("Alpha"),
      teamB: makeTeamSlot("Beta"),
    });
    const group = makeGroup({
      categories: [makeCategory("Cat A", 0, [activeMatch]) as never],
    });

    render(<GroupManageView initialGroup={group} />);

    expect(screen.getByText(/alpha/i)).toBeInTheDocument();
    expect(screen.getByText(/beta/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /enter scores/i })).toBeInTheDocument();
  });

  it("hides enter scores button when no active match", () => {
    const group = makeGroup({
      categories: [makeCategory("Cat A", 0, [makeMatch({ status: "pending" })]) as never],
    });
    render(<GroupManageView initialGroup={group} />);

    expect(screen.queryByRole("button", { name: /enter scores/i })).not.toBeInTheDocument();
  });

  it("shows next queued match label when computeNextMatches returns a match for the category", async () => {
    const { computeNextMatches } = await import("@/lib/groups/scheduler");
    const nextMatchId = new Types.ObjectId();
    const pendingMatch = makeMatch({
      _id: nextMatchId,
      status: "ready",
      teamA: makeTeamSlot("Gamma"),
      teamB: makeTeamSlot("Delta"),
      label: "WB R1 M2",
    });
    const group = makeGroup({ categories: [makeCategory("Cat A", 0, [pendingMatch]) as never] });

    vi.mocked(computeNextMatches).mockReturnValue([
      { categoryIndex: 0, matchId: nextMatchId.toString() } as MatchActivation,
    ]);

    render(<GroupManageView initialGroup={group} />);

    expect(screen.getByText(/next up/i)).toBeInTheDocument();
    expect(screen.getByText(/WB R1 M2/i)).toBeInTheDocument();
  });

  it("shows idle indicator when category has ready matches but none are activatable", async () => {
    const { computeNextMatches } = await import("@/lib/groups/scheduler");
    const pendingMatch = makeMatch({
      status: "ready",
      teamA: makeTeamSlot("Zeta"),
      teamB: makeTeamSlot("Eta"),
    });
    const group = makeGroup({ categories: [makeCategory("Cat B", 0, [pendingMatch]) as never] });

    // No activations for this category → all teams blocked
    vi.mocked(computeNextMatches).mockReturnValue([]);

    render(<GroupManageView initialGroup={group} />);

    expect(screen.getByText(/waiting.*teams occupied/i)).toBeInTheDocument();
  });

  it("opens ScoreEntry for the correct match when enter scores is clicked", async () => {
    const matchId = new Types.ObjectId();
    const activeMatch = makeMatch({
      _id: matchId,
      status: "in_progress",
      teamA: makeTeamSlot("Alpha"),
      teamB: makeTeamSlot("Beta"),
    });
    const group = makeGroup({
      categories: [makeCategory("Cat A", 0, [activeMatch]) as never],
    });

    render(<GroupManageView initialGroup={group} />);
    fireEvent.click(screen.getByRole("button", { name: /enter scores/i }));

    await waitFor(() =>
      expect(screen.getByTestId("score-entry")).toBeInTheDocument(),
    );
    expect(screen.getByTestId("score-entry").dataset.matchId).toBe(matchId.toString());
  });

  it("closes ScoreEntry when onClose is called", async () => {
    const activeMatch = makeMatch({
      status: "in_progress",
      teamA: makeTeamSlot("Alpha"),
      teamB: makeTeamSlot("Beta"),
    });
    const group = makeGroup({
      categories: [makeCategory("Cat A", 0, [activeMatch]) as never],
    });

    render(<GroupManageView initialGroup={group} />);
    fireEvent.click(screen.getByRole("button", { name: /enter scores/i }));
    await waitFor(() =>
      expect(screen.getByTestId("score-entry")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: /close score modal/i }));
    await waitFor(() =>
      expect(screen.queryByTestId("score-entry")).not.toBeInTheDocument(),
    );
  });

  it("hides start button when group is active", () => {
    const group = makeGroup({ status: "active" });
    render(<GroupManageView initialGroup={group} />);

    expect(screen.queryByRole("button", { name: /start group/i })).not.toBeInTheDocument();
  });

  it("shows start button when group is draft and calls POST start endpoint", async () => {
    const groupId = new Types.ObjectId();
    const group = makeGroup({ _id: groupId, status: "draft" });

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "active" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const mutate = vi.fn();
    useSWR.mockImplementation(
      (_key: string, _fetcher: unknown, options: { fallbackData: ITournamentGroup }) => ({
        data: options.fallbackData,
        mutate,
      }),
    );

    render(<GroupManageView initialGroup={group} />);

    expect(screen.getByRole("button", { name: /start group/i })).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /start group/i }));
    });

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/groups/${groupId.toString()}/start`,
        expect.objectContaining({ method: "POST" }),
      ),
    );
  });

  it("shows GroupLeaderboard when group is completed", () => {
    const group = makeGroup({ name: "Beach Cup", status: "completed" });
    render(<GroupManageView initialGroup={group} />);

    expect(screen.getByTestId("group-leaderboard")).toBeInTheDocument();
    expect(screen.getByTestId("group-leaderboard")).toHaveTextContent("Beach Cup leaderboard");
  });

  it("does not show category live rows when group is completed", () => {
    const group = makeGroup({
      status: "completed",
      categories: [makeCategory("Cat A", 0) as never],
    });
    render(<GroupManageView initialGroup={group} />);

    expect(screen.queryByText("Cat A")).not.toBeInTheDocument();
  });

  it("renders 'Gruppe starten' start button in German locale", async () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "de");
    const { LocaleProvider } = await import("@/components/ui/LocaleProvider");
    const groupId = new Types.ObjectId();
    const group = makeGroup({ _id: groupId, status: "draft" });
    render(<LocaleProvider><GroupManageView initialGroup={group} /></LocaleProvider>);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Gruppe starten" })).toBeInTheDocument(),
    );
  });

  it("renders 'Ergebnisse eingeben' button in German locale for active match", async () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "de");
    const { LocaleProvider } = await import("@/components/ui/LocaleProvider");
    const matchId = new Types.ObjectId();
    const activeMatch = makeMatch({
      _id: matchId,
      status: "in_progress",
      teamA: makeTeamSlot("Alpha"),
      teamB: makeTeamSlot("Beta"),
    });
    const group = makeGroup({
      categories: [makeCategory("Cat A", 0, [activeMatch]) as never],
    });
    render(<LocaleProvider><GroupManageView initialGroup={group} /></LocaleProvider>);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Ergebnisse eingeben" })).toBeInTheDocument(),
    );
  });

  it("SWR is called with refreshInterval that stops when completed", () => {
    const group = makeGroup({ status: "active" });
    render(<GroupManageView initialGroup={group} />);

    const [, , options] = useSWR.mock.calls[0];
    expect(typeof options.refreshInterval).toBe("function");
    expect(options.refreshInterval({ status: "active" })).toBe(5000);
    expect(options.refreshInterval({ status: "completed" })).toBe(0);
  });
});
