import { describe, expect, it, beforeEach, vi } from "vitest";
import { Tournament } from "@/lib/models/Tournament";
import { User } from "@/lib/models/User";

const { requireAdmin } = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/adminAuth", () => ({
  requireAdmin,
}));

import { GET as getDashboard } from "@/app/api/admin/dashboard/route";

describe("/api/admin/dashboard", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    requireAdmin.mockResolvedValue(true);
  });

  it("requires an admin session", async () => {
    requireAdmin.mockResolvedValue(false);

    const response = await getDashboard();

    expect(response.status).toBe(401);
  });

  it("returns dashboard metrics", async () => {
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
    await Tournament.create({
      name: "Admin Cup",
      status: "active",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
    });

    const response = await getDashboard();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.metrics).toMatchObject({
      registeredAdmins: 1,
      registeredPlayers: 1,
      registeredTournaments: 1,
      tournamentsByStatus: {
        active: 1,
        completed: 0,
        draft: 0,
      },
    });
  });
});
