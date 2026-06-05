// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeMatch, makeTeams, makeTournament } from "@/__tests__/helpers/factories";
import NewTournamentPage from "@/app/admin/tournament/new/page";
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
    expect(screen.getByText(de("adminLogin"))).toBeInTheDocument();
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
    expect(screen.getByText(de("completed"))).toBeInTheDocument();
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
});
