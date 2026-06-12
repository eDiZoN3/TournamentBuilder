import { renderToStaticMarkup } from "react-dom/server";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeMatch, makeSet, makeTeams } from "@/__tests__/helpers/factories";
import AccountPage from "@/app/(public)/account/page";
import { PlayerProfile } from "@/lib/models/PlayerProfile";
import { PracticeMatch } from "@/lib/models/PracticeMatch";
import { Tournament } from "@/lib/models/Tournament";

const { getServerSession, redirect, capturedAccountProps } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  redirect: vi.fn((destination: string) => {
    throw new Error(`REDIRECT:${destination}`);
  }),
  capturedAccountProps: [] as Array<Record<string, unknown>>,
}));

vi.mock("next-auth", () => ({
  getServerSession,
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("@/components/player/PlayerAccountView", () => ({
  PlayerAccountView: (props: Record<string, unknown>) => {
    capturedAccountProps.push(props);

    return <section>Account view</section>;
  },
}));

describe("account page", () => {
  beforeEach(() => {
    getServerSession.mockReset();
    redirect.mockClear();
    capturedAccountProps.length = 0;
  });

  it("redirects visitors who are not signed in as players", async () => {
    getServerSession.mockResolvedValue({
      user: {
        id: new Types.ObjectId().toString(),
        role: "admin",
      },
    });

    await expect(AccountPage()).rejects.toThrow("REDIRECT:/signup");

    expect(redirect).toHaveBeenCalledWith("/signup");
  });

  it("redirects players without a linked profile", async () => {
    getServerSession.mockResolvedValue({
      user: {
        id: new Types.ObjectId().toString(),
        role: "player",
      },
    });

    await expect(AccountPage()).rejects.toThrow("REDIRECT:/signup");

    expect(redirect).toHaveBeenCalledWith("/signup");
  });

  it("passes profile, tournament stats, and practice stats to the account view", async () => {
    const userId = new Types.ObjectId();
    const profile = await PlayerProfile.create({
      userId,
      firstName: "Alice",
      surname: "Example",
      displayName: "Alice Example",
      email: "alice@example.com",
    });
    const teams = makeTeams(2);
    teams[0].name = "Alpha";
    teams[0].players = ["Alice Example"];
    teams[1].name = "Beta";
    teams[1].players = ["Bob"];

    await Tournament.create({
      name: "Account Cup",
      status: "completed",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      teams,
      matches: [
        makeMatch({
          status: "completed",
          teamA: { teamId: teams[0]._id, sets: [makeSet(11, 8)] },
          teamB: { teamId: teams[1]._id, sets: [] },
          winnerId: teams[0]._id,
          loserId: teams[1]._id,
        }),
      ],
    });
    const practiceMatch = await PracticeMatch.create({
      createdBy: profile._id,
      playedAt: new Date("2026-06-06T12:00:00.000Z"),
      sideA: [
        {
          playerProfileId: profile._id,
          displayName: "Alice Example",
        },
      ],
      sideB: [{ displayName: "Guest Bob" }],
      sets: [{ scoreA: 11, scoreB: 7, pointsToWin: 11 }],
      winnerSide: "A",
    });
    getServerSession.mockResolvedValue({
      user: {
        id: userId.toString(),
        role: "player",
      },
    });

    const markup = renderToStaticMarkup(await AccountPage());
    const props = capturedAccountProps[0] as {
      practiceMatches: Array<{ _id: string }>;
      practiceStats: { matchesPlayed: number; matchesWon: number; pointsFor: number };
      profile: { _id: string; displayName: string; email: string; userId: string };
      stats: { matchesPlayed: number; matchesWon: number; pointsFor: number };
    };

    expect(markup).toContain("Account view");
    expect(props.profile).toMatchObject({
      _id: profile._id.toString(),
      displayName: "Alice Example",
      email: "alice@example.com",
      userId: userId.toString(),
    });
    expect(props.stats).toMatchObject({
      matchesPlayed: 1,
      matchesWon: 1,
      pointsFor: 11,
    });
    expect(props.practiceStats).toMatchObject({
      matchesPlayed: 1,
      matchesWon: 1,
      pointsFor: 11,
    });
    expect(props.practiceMatches).toHaveLength(1);
    expect(props.practiceMatches[0]._id).toBe(practiceMatch._id.toString());
  });
});
