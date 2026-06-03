import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { User } from "@/lib/models/User";

const { requireAdminSession } = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
}));

vi.mock("@/lib/adminAuth", () => ({
  requireAdminSession,
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
    requireAdminSession.mockReset();
  });

  it("requires an authenticated admin session", async () => {
    requireAdminSession.mockResolvedValue(null);

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
    requireAdminSession.mockResolvedValue({ user: { id: "admin-id" } });

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
    requireAdminSession.mockResolvedValue({
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

  it("updates the password hash and clears the first-login flag", async () => {
    const admin = await User.create({
      email: "admin@example.com",
      mustChangePassword: true,
      passwordHash: await bcrypt.hash("temporary1", 4),
    });
    requireAdminSession.mockResolvedValue({
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
    expect(body).toMatchObject({ mustChangePassword: false });

    const updatedAdmin = await User.findById(admin._id);

    expect(updatedAdmin?.mustChangePassword).toBe(false);
    await expect(
      bcrypt.compare("new-password", updatedAdmin!.passwordHash),
    ).resolves.toBe(true);
    await expect(
      bcrypt.compare("temporary1", updatedAdmin!.passwordHash),
    ).resolves.toBe(false);
  });
});
