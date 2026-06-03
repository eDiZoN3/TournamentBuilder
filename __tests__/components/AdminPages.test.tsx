import { renderToStaticMarkup } from "react-dom/server";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeMatch, makeTeams } from "@/__tests__/helpers/factories";
import AdminDashboardPage from "@/app/admin/dashboard/page";
import ManageTournamentPage from "@/app/admin/tournament/[id]/manage/page";
import { PlayerProfile } from "@/lib/models/PlayerProfile";
import { User } from "@/lib/models/User";
import { Tournament } from "@/lib/models/Tournament";

const { notFound } = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound,
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("admin dashboard page", () => {
  it("server-renders stored tournaments", async () => {
    await Tournament.create({
      name: "Admin Cup",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
    });
    await User.create({
      email: "owner@example.com",
      passwordHash: "hashed-password",
    });
    const player = await User.create({
      email: "alice@example.com",
      passwordHash: "hashed-password",
      role: "player",
    });
    await PlayerProfile.create({
      userId: player._id,
      firstName: "Alice",
      surname: "Example",
      displayName: "Alice Example",
      email: "alice@example.com",
    });

    const markup = renderToStaticMarkup(await AdminDashboardPage());

    expect(markup).toContain("Admin Cup");
    expect(markup).toContain("Create New Tournament");
    expect(markup).toContain("owner@example.com");
    expect(markup).toContain("Registered players");
    expect(markup).toContain("Alice Example");
  });
});

describe("admin manage page", () => {
  beforeEach(() => {
    notFound.mockClear();
  });

  it("server-renders the tournament management view", async () => {
    const teams = makeTeams(2);
    const tournament = await Tournament.create({
      name: "Managed Cup",
      status: "active",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      teams,
      matches: [
        makeMatch({
          status: "ready",
          teamA: { teamId: teams[0]._id, sets: [] },
          teamB: { teamId: teams[1]._id, sets: [] },
        }),
      ],
    });

    const markup = renderToStaticMarkup(
      await ManageTournamentPage({
        params: Promise.resolve({ id: tournament._id.toString() }),
      }),
    );

    expect(markup).toContain("Managed Cup");
    expect(markup).toContain("0/1 courts in use");
  });

  it("uses the not-found page for an unknown tournament", async () => {
    await expect(
      ManageTournamentPage({
        params: Promise.resolve({ id: new Types.ObjectId().toString() }),
      }),
    ).rejects.toThrow("NOT_FOUND");

    expect(notFound).toHaveBeenCalled();
  });
});
