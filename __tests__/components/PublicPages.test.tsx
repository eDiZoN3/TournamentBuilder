import { renderToStaticMarkup } from "react-dom/server";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeMatch, makeTeams } from "@/__tests__/helpers/factories";
import HomePage from "@/app/(public)/page";
import StatsPage from "@/app/(public)/stats/page";
import TournamentPage from "@/app/(public)/tournament/[id]/page";
import { Tournament } from "@/lib/models/Tournament";

const { notFound } = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound,
}));

describe("public tournament list", () => {
  it("shows an empty state when no tournaments exist", async () => {
    const markup = renderToStaticMarkup(await HomePage());

    expect(markup).toContain("No tournaments yet.");
  });

  it("lists tournaments with status and bracket links", async () => {
    const tournament = await Tournament.create({
      name: "Public Cup",
      status: "active",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
    });

    const markup = renderToStaticMarkup(await HomePage());

    expect(markup).toContain("Public Cup");
    expect(markup).toContain("Active");
    expect(markup).toContain(`/tournament/${tournament._id.toString()}`);
  });
});

describe("public global stats page", () => {
  it("renders cross-season team and player stats", async () => {
    const teams = makeTeams(2);
    teams[0].name = "Alpha";
    teams[0].players = ["Alice"];
    teams[1].name = "Beta";
    teams[1].players = ["Bob"];
    await Tournament.create({
      name: "Stats Cup",
      status: "completed",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      teams,
      matches: [
        makeMatch({
          status: "completed",
          teamA: { teamId: teams[0]._id, sets: [{ scoreA: 11, scoreB: 9, pointsToWin: 11 }] },
          teamB: { teamId: teams[1]._id, sets: [] },
          winnerId: teams[0]._id,
          loserId: teams[1]._id,
        }),
      ],
    });

    const markup = renderToStaticMarkup(await StatsPage());

    expect(markup).toContain("Global stats");
    expect(markup).toContain("Alpha");
    expect(markup).toContain("Alice");
  });

  it("renders an empty state when no stats exist", async () => {
    const markup = renderToStaticMarkup(await StatsPage());

    expect(markup).toContain("No team stats yet");
    expect(markup).toContain("No player stats yet");
  });
});

describe("public tournament bracket page", () => {
  beforeEach(() => {
    notFound.mockClear();
  });

  it("server-renders the initial tournament bracket", async () => {
    const teams = makeTeams(2);
    const tournament = await Tournament.create({
      name: "Loaded Cup",
      status: "active",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      teams,
      matches: [
        makeMatch({
          label: "WB Final",
          status: "ready",
          isWBFinal: true,
          teamA: { teamId: teams[0]._id, sets: [] },
          teamB: { teamId: teams[1]._id, sets: [] },
        }),
      ],
    });

    const markup = renderToStaticMarkup(
      await TournamentPage({
        params: Promise.resolve({ id: tournament._id.toString() }),
      }),
    );

    expect(markup).toContain("Loaded Cup");
    expect(markup).toContain("Team A");
    expect(markup).toContain("Team B");
  });

  it("uses the not-found page for an invalid tournament id", async () => {
    await expect(
      TournamentPage({
        params: Promise.resolve({ id: "invalid" }),
      }),
    ).rejects.toThrow("NOT_FOUND");

    expect(notFound).toHaveBeenCalled();
  });

  it("uses the not-found page for an unknown tournament", async () => {
    await expect(
      TournamentPage({
        params: Promise.resolve({ id: new Types.ObjectId().toString() }),
      }),
    ).rejects.toThrow("NOT_FOUND");

    expect(notFound).toHaveBeenCalled();
  });
});
