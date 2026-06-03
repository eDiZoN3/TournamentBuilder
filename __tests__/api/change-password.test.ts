import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { User } from "@/lib/models/User";

const { requireAuthenticatedSession } = vi.hoisted(() => ({
  requireAuthenticatedSession: vi.fn(),
}));

vi.mock("@/lib/adminAuth", () => ({
  requireAuthenticatedSession,
}));

import { POST as changePassword } from "@/app/api/admin/change-password/route";

function request(body?: Record<string, unknown>) {
  return new NextRequest("http://localhost:3000/api/admin/change-password", {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
    headers: body
      ? {
          "content-type": "application/json",
        }
      : undefined,
  });
}

describe("/api/admin/change-password", () => {
  beforeEach(() => {
    requireAuthenticatedSession.mockReset();
  });

  it("requires an authenticated account session", async () => {
    requireAuthenticatedSession.mockResolvedValue(null);

    const response = await changePassword(
      request({
        currentPassword: "temporary1",
        newPassword: "new-password",
        confirmPassword: "new-password",
      }),
    );

    expect(response.status).toBe(401);
  });

  it("rejects mismatched password confirmation", async () => {
    requireAuthenticatedSession.mockResolvedValue({ user: { id: "admin-id" } });

    const response = await changePassword(
      request({
        currentPassword: "temporary1",
        newPassword: "new-password",
        confirmPassword: "different-password",
      }),
    );

    expect(response.status).toBe(422);
  });

  it("rejects an incorrect current password", async () => {
    const admin = await User.create({
      email: "admin@example.com",
      mustChangePassword: true,
      passwordHash: await bcrypt.hash("temporary1", 4),
    });
    requireAuthenticatedSession.mockResolvedValue({
      user: { id: admin._id.toString(), role: "admin" },
    });

    const response = await changePassword(
      request({
        currentPassword: "wrong-password",
        newPassword: "new-password",
        confirmPassword: "new-password",
      }),
    );

    expect(response.status).toBe(409);
  });

  it("updates the admin password hash and clears the first-login flag", async () => {
    const admin = await User.create({
      email: "admin@example.com",
      mustChangePassword: true,
      passwordHash: await bcrypt.hash("temporary1", 4),
    });
    requireAuthenticatedSession.mockResolvedValue({
      user: { id: admin._id.toString(), role: "admin" },
    });

    const response = await changePassword(
      request({
        currentPassword: "temporary1",
        newPassword: "new-password",
        confirmPassword: "new-password",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ mustChangePassword: false, role: "admin" });

    const updatedAdmin = await User.findById(admin._id);

    expect(updatedAdmin?.mustChangePassword).toBe(false);
    await expect(
      bcrypt.compare("new-password", updatedAdmin!.passwordHash),
    ).resolves.toBe(true);
    await expect(
      bcrypt.compare("temporary1", updatedAdmin!.passwordHash),
    ).resolves.toBe(false);
  });

  it("lets reset players set their own password and clears the forced-change flag", async () => {
    const player = await User.create({
      email: "player@example.com",
      mustChangePassword: true,
      passwordHash: await bcrypt.hash("temporary1", 4),
      role: "player",
    });
    requireAuthenticatedSession.mockResolvedValue({
      user: { id: player._id.toString(), role: "player" },
    });

    const response = await changePassword(
      request({
        currentPassword: "temporary1",
        newPassword: "player-password",
        confirmPassword: "player-password",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ mustChangePassword: false, role: "player" });

    const updatedPlayer = await User.findById(player._id);

    expect(updatedPlayer?.mustChangePassword).toBe(false);
    await expect(
      bcrypt.compare("player-password", updatedPlayer!.passwordHash),
    ).resolves.toBe(true);
  });
});
