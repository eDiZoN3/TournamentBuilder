import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession,
}));

import { requireAdmin } from "@/lib/adminAuth";

describe("requireAdmin", () => {
  beforeEach(() => {
    getServerSession.mockReset();
  });

  it("allows admin sessions", async () => {
    getServerSession.mockResolvedValue({
      user: {
        role: "admin",
      },
    });

    await expect(requireAdmin()).resolves.toBe(true);
  });

  it("allows tournament lead sessions", async () => {
    getServerSession.mockResolvedValue({
      user: {
        role: "tournament_lead",
      },
    });

    await expect(requireAdmin()).resolves.toBe(true);
  });

  it("rejects missing sessions", async () => {
    getServerSession.mockResolvedValue(null);

    await expect(requireAdmin()).resolves.toBe(false);
  });
});
