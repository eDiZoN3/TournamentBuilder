import { describe, expect, it } from "vitest";
import {
  makeMatch,
  makeTeams,
} from "@/__tests__/helpers/factories";
import { getAdminDashboardMetrics } from "@/lib/admin/dashboardMetrics";
import { Tournament } from "@/lib/models/Tournament";
import { User } from "@/lib/models/User";

describe("getAdminDashboardMetrics", () => {
  it("returns stable zero values for an empty database", async () => {
    await expect(getAdminDashboardMetrics()).resolves.toEqual({
      playedMatches: 0,
      registeredAdmins: 0,
      registeredPlayers: 0,
      registeredTournaments: 0,
      tournamentsByStatus: {
        active: 0,
        completed: 0,
        draft: 0,
      },
    });
  });

  it("counts users, tournaments, statuses, and completed playable matches", async () => {
    const teams = makeTeams(2);

    await User.create({
      email: "owner@example.com",
      passwordHash: "hashed-password",
      role: "admin",
    });
    await User.create({
      email: "alice@example.com",
      passwordHash: "hashed-password",
      role: "player",
    });
    await User.create({
      email: "bob@example.com",
      passwordHash: "hashed-password",
      role: "player",
    });
    await Tournament.create({
      name: "Draft Cup",
      status: "draft",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
    });
    await Tournament.create({
      name: "Active Cup",
      status: "active",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      teams,
      matches: [
        makeMatch({
          status: "completed",
          teamA: { teamId: teams[0]._id, sets: [] },
          teamB: { teamId: teams[1]._id, sets: [] },
          winnerId: teams[0]._id,
        }),
        makeMatch({
          isBye: true,
          status: "completed",
          teamA: { teamId: teams[0]._id, sets: [] },
          winnerId: teams[0]._id,
        }),
      ],
    });
    await Tournament.create({
      name: "Completed Cup",
      status: "completed",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      teams,
      matches: [
        makeMatch({
          status: "completed",
          teamA: { teamId: teams[0]._id, sets: [] },
          teamB: { teamId: teams[1]._id, sets: [] },
          winnerId: teams[1]._id,
        }),
        makeMatch({
          status: "ready",
          teamA: { teamId: teams[0]._id, sets: [] },
          teamB: { teamId: teams[1]._id, sets: [] },
        }),
      ],
    });

    await expect(getAdminDashboardMetrics()).resolves.toEqual({
      playedMatches: 2,
      registeredAdmins: 1,
      registeredPlayers: 2,
      registeredTournaments: 3,
      tournamentsByStatus: {
        active: 1,
        completed: 1,
        draft: 1,
      },
    });
  });
});
