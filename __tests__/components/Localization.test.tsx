// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeMatch, makeTeams, makeTournament } from "@/__tests__/helpers/factories";
import NewTournamentPage from "@/app/admin/tournament/new/page";
import { RoundRobinView } from "@/components/tournament/RoundRobinView";
import { LocaleProvider, LOCALE_STORAGE_KEY } from "@/components/ui/LocaleProvider";
import { Navbar } from "@/components/ui/Navbar";
import { StatusBadge } from "@/components/ui/StatusBadge";
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

    expect(await screen.findByText("Turniere")).toBeInTheDocument();
    expect(screen.getByText("Statistiken")).toBeInTheDocument();
    expect(screen.getByText("Registrieren")).toBeInTheDocument();
    expect(screen.getByText("Admin-Login")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sprache auf Englisch wechseln" }),
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
      await screen.findByRole("heading", { name: "Neues Turnier" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Turnierformat")).toBeInTheDocument();
    expect(screen.getByText("Team-Rundenturnier")).toBeInTheDocument();
    expect(screen.getByText("Einzel-Mixer")).toBeInTheDocument();
    expect(screen.getByText("Abgeschlossen")).toBeInTheDocument();
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

    expect(await screen.findByRole("heading", { name: "Tabelle" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Spielplan" })).toBeInTheDocument();
    expect(screen.getByText("Runde 1")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Siege" })).toBeInTheDocument();
  });
});
