// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeMatch, makeTeams, makeTournament } from "@/__tests__/helpers/factories";
import NewTournamentPage from "@/app/admin/tournament/new/page";
import { AdminDashboard, type TournamentSummary } from "@/components/admin/AdminDashboard";
import { ScoreEntry } from "@/components/admin/ScoreEntry";
import { MatchCard } from "@/components/bracket/MatchCard";
import { JoinTournamentButton } from "@/components/player/JoinTournamentButton";
import { PlayerAccountView } from "@/components/player/PlayerAccountView";
import { StatsTable } from "@/components/stats/StatsTable";
import { RoundRobinView } from "@/components/tournament/RoundRobinView";
import { LocaleProvider, LOCALE_STORAGE_KEY } from "@/components/ui/LocaleProvider";
import { Navbar } from "@/components/ui/Navbar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { translate, type TranslationKey } from "@/lib/i18n";
import type { ITournament } from "@/lib/models/Tournament";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

function renderGerman(ui: React.ReactNode) {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, "de");

  return render(<LocaleProvider>{ui}</LocaleProvider>);
}

function de(key: TranslationKey) {
  return translate("de", key);
}

describe("frontend localization", () => {
  let storageEntries: Map<string, string>;

  beforeEach(() => {
    storageEntries = new Map();
    const storage = {
      clear: () => storageEntries.clear(),
      getItem: (key: string) => storageEntries.get(key) ?? null,
      removeItem: (key: string) => storageEntries.delete(key),
      setItem: (key: string, value: string) =>
        storageEntries.set(key, String(value)),
    };

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: storage,
    });
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: storage,
    });
    window.localStorage.clear();
    document.documentElement.lang = "";
    document.documentElement.removeAttribute("data-locale");
  });

  it("translates shared public navigation in German mode", async () => {
    renderGerman(<Navbar isAuthenticated={false} />);

    expect(await screen.findByText(de("tournaments"))).toBeInTheDocument();
    expect(screen.getByText(de("stats"))).toBeInTheDocument();
    expect(screen.getByText(de("signUp"))).toBeInTheDocument();
    expect(screen.getByRole("link", { name: de("signIn") })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: de("languageSwitchToEnglish") }),
    ).toBeInTheDocument();
  });

  it("translates creation form labels and status badges", async () => {
    renderGerman(
      <>
        <NewTournamentPage />
        <StatusBadge status="completed" />
      </>,
    );

    expect(
      await screen.findByRole("heading", { name: de("newTournament") }),
    ).toBeInTheDocument();
    expect(screen.getByText(de("tournamentFormat"))).toBeInTheDocument();
    expect(screen.getByText(de("teamRoundRobin"))).toBeInTheDocument();
    expect(screen.getByText(de("individualMixer"))).toBeInTheDocument();
    expect(screen.getByText(de("teamEntry"))).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(de("teamRoundRobin")));

    expect(screen.getByText(de("roundRobinMatchFormat"))).toBeInTheDocument();
    expect(screen.getByText(de("oneSetPerMatch"))).toBeInTheDocument();
    expect(screen.getByText(de("bestOfThree"))).toBeInTheDocument();
    expect(screen.getByText(de("completed"))).toBeInTheDocument();
  });

  it("translates admin dashboard labels and actions", async () => {
    const tournaments: TournamentSummary[] = [
      {
        _id: "draft-id",
        createdAt: "2026-06-01T12:00:00.000Z",
        matchCount: 0,
        name: "Draft Cup",
        status: "draft",
        teamCount: 4,
      },
    ];

    renderGerman(<AdminDashboard initialTournaments={tournaments} />);

    expect(
      await screen.findByRole("link", { name: de("publicTournamentList") }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: de("tournaments") })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: de("accounts") })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: de("statsReset") })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: `${de("publicView")} Draft Cup` }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: de("accounts") }));

    expect(screen.getByRole("heading", { name: de("playerAccounts") })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: de("tournamentLeadAccounts") }),
    ).toBeInTheDocument();
  });

  it("translates join controls, score entry actions, and stats columns", async () => {
    const teams = makeTeams(2);
    const match = makeMatch({
      status: "in_progress",
      teamA: { teamId: teams[0]._id, sets: [] },
      teamB: { teamId: teams[1]._id, sets: [] },
    });

    renderGerman(
      <>
        <JoinTournamentButton
          currentPlayerName={null}
          initiallyJoined={false}
          tournamentId="tournament-id"
        />
        <ScoreEntry
          match={match}
          onClose={vi.fn()}
          onUpdated={vi.fn()}
          teamAName="Alpha"
          teamBName="Beta"
          tournamentId="tournament-id"
        />
        <StatsTable
          emptyTitle={de("noTeamStats")}
          rows={[
            {
              matchesLost: 0,
              matchesPlayed: 1,
              matchesWon: 1,
              name: "Alpha",
              pointDiff: 4,
              pointsAgainst: 7,
              pointsFor: 11,
              setsLost: 0,
              setsWon: 1,
              winRate: 1,
            },
          ]}
          title={de("teamStats")}
        />
      </>,
    );

    expect(await screen.findByRole("link", { name: de("signUpToJoin") })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: de("enterScores") })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: de("close") })).toBeInTheDocument();
    expect(screen.getByText(`${de("set")} 1`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `${de("saveSet")} 1` })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: de("pointsDiff") })).toBeInTheDocument();
  });

  it("translates non-knockout standings and schedule headings", async () => {
    const teams = makeTeams(2);
    const tournament = {
      ...makeTournament({
        format: "team_round_robin",
        status: "active",
        teams,
        matches: [
          makeMatch({
            label: "Round 1",
            status: "ready",
            teamA: { teamId: teams[0]._id, sets: [] },
            teamB: { teamId: teams[1]._id, sets: [] },
          }),
        ],
      }),
      updatedAt: new Date(),
    } as ITournament;

    renderGerman(<RoundRobinView tournament={tournament} />);

    expect(
      await screen.findByRole("heading", { name: de("standings") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: de("schedule") }),
    ).toBeInTheDocument();
    expect(screen.getByText(`${de("round")} 1`)).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: de("wins") }),
    ).toBeInTheDocument();
  });

  it("renders bracket match labels and place ranges in German", async () => {
    renderGerman(
      <>
        <MatchCard match={makeMatch({ label: "WB Semi-Final" })} />
        <MatchCard
          match={makeMatch({ label: "WB Final", isWBFinal: true, placeRange: "1st-2nd Place" })}
        />
      </>,
    );

    expect(await screen.findByText(de("semiFinal"))).toBeInTheDocument();
    expect(screen.getByText(de("final"))).toBeInTheDocument();
    expect(screen.getByText("1.-2. Platz")).toBeInTheDocument();
    expect(screen.queryByText("WB Semi-Final")).not.toBeInTheDocument();
    expect(screen.queryByText("WB Final")).not.toBeInTheDocument();
    expect(screen.queryByText("1st-2nd Place")).not.toBeInTheDocument();
  });

  it("translates player practice match account sections", async () => {
    renderGerman(
      <PlayerAccountView
        practiceMatches={[]}
        practiceStats={null}
        profile={{
          _id: "profile-id",
          displayName: "Alice Example",
          email: "alice@example.com",
          firstName: "Alice",
          userId: "user-id",
        }}
        stats={null}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: de("practiceStats") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: de("practiceMatches") }),
    ).toBeInTheDocument();
    expect(screen.getByText(de("noPracticeStats"))).toBeInTheDocument();
  });
});
