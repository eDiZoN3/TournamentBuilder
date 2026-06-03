import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { User } from "@/lib/models/User";

const { requireAdmin } = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/adminAuth", () => ({
  requireAdmin,
}));

import { GET as listAdmins, POST as createAdmin } from "@/app/api/admin/users/route";

function request(body?: Record<string, unknown>) {
  return new NextRequest("http://localhost:3000/api/admin/users", {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
    headers: body
      ? {
          "content-type": "application/json",
        }
      : undefined,
  });
}

describe("/api/admin/users", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    requireAdmin.mockResolvedValue(true);
  });

  it("lists admin accounts without password hashes", async () => {
    await User.create({
      email: "owner@example.com",
      passwordHash: await bcrypt.hash("owner-password", 4),
    });
    await User.create({
      email: "new-admin@example.com",
      mustChangePassword: true,
      passwordHash: await bcrypt.hash("temporary", 4),
    });

    const response = await listAdmins();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.admins).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          _id: expect.any(String),
          email: "owner@example.com",
          mustChangePassword: false,
          createdAt: expect.any(String),
        }),
        expect.objectContaining({
          email: "new-admin@example.com",
          mustChangePassword: true,
        }),
      ]),
    );
    expect(JSON.stringify(body)).not.toContain("passwordHash");
  });

  it("creates an admin with a one-time ten-character temporary password", async () => {
    const response = await createAdmin(
      request({
        email: " NEW-ADMIN@EXAMPLE.COM ",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      admin: {
        _id: expect.any(String),
        email: "new-admin@example.com",
        mustChangePassword: true,
      },
      temporaryPassword: expect.any(String),
    });
    expect(body.temporaryPassword).toHaveLength(10);

    const storedAdmin = await User.findOne({ email: "new-admin@example.com" });

    expect(storedAdmin).not.toBeNull();
    expect(storedAdmin?.mustChangePassword).toBe(true);
    expect(storedAdmin?.passwordHash).not.toBe(body.temporaryPassword);
    await expect(
      bcrypt.compare(body.temporaryPassword, storedAdmin!.passwordHash),
    ).resolves.toBe(true);
  });

  it("rejects duplicate admin emails", async () => {
    await User.create({
      email: "admin@example.com",
      passwordHash: await bcrypt.hash("password", 4),
    });

    const response = await createAdmin(
      request({
        email: "ADMIN@example.com",
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("rejects invalid email addresses", async () => {
    const response = await createAdmin(
      request({
        email: "not-an-email",
      }),
    );

    expect(response.status).toBe(422);
  });

  it("requires an admin session", async () => {
    requireAdmin.mockResolvedValue(false);

    const response = await createAdmin(
      request({
        email: "admin@example.com",
      }),
    );

    expect(response.status).toBe(401);
  });
});
