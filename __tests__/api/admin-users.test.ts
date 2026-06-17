import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { User } from "@/lib/models/User";

const { requireAdmin, requireAdminSession, requireStrictAdmin } = vi.hoisted(
  () => ({
    requireAdmin: vi.fn(),
    requireAdminSession: vi.fn(),
    requireStrictAdmin: vi.fn(),
  }),
);

vi.mock("@/lib/adminAuth", () => ({
  requireAdmin,
  requireAdminSession,
  requireStrictAdmin,
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

function deleteRequest(id: string) {
  return new NextRequest(`http://localhost:3000/api/admin/users/${id}`, {
    method: "DELETE",
  });
}

function context(id: string) {
  return {
    params: Promise.resolve({ id }),
  };
}

async function deleteAdmin(id: string) {
  const { DELETE } = await import("@/app/api/admin/users/[id]/route");

  return DELETE(deleteRequest(id), context(id));
}

describe("/api/admin/users", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    requireAdmin.mockResolvedValue(true);
    requireAdminSession.mockReset();
    requireAdminSession.mockResolvedValue({
      user: {
        id: "owner-id",
        role: "admin",
      },
    });
    requireStrictAdmin.mockReset();
    requireStrictAdmin.mockResolvedValue(true);
  });

  it("lists admin and tournament lead accounts without password hashes", async () => {
    await User.create({
      email: "owner@example.com",
      passwordHash: await bcrypt.hash("owner-password", 4),
      role: "admin",
    });
    await User.create({
      email: "new-lead@example.com",
      mustChangePassword: true,
      passwordHash: await bcrypt.hash("temporary", 4),
      role: "tournament_lead",
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
          role: "admin",
          displayRole: "Admin",
          createdAt: expect.any(String),
        }),
        expect.objectContaining({
          email: "new-lead@example.com",
          mustChangePassword: true,
          role: "tournament_lead",
          displayRole: "Tournament Lead",
        }),
      ]),
    );
    expect(JSON.stringify(body)).not.toContain("passwordHash");
  });

  it("creates a tournament lead with a one-time ten-character temporary password", async () => {
    const response = await createAdmin(
      request({
        email: " NEW-LEAD@EXAMPLE.COM ",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      admin: {
        _id: expect.any(String),
        email: "new-lead@example.com",
        mustChangePassword: true,
        role: "tournament_lead",
        displayRole: "Tournament Lead",
      },
      temporaryPassword: expect.any(String),
    });
    expect(body.temporaryPassword).toHaveLength(10);

    const storedAdmin = await User.findOne({ email: "new-lead@example.com" });

    expect(storedAdmin).not.toBeNull();
    expect(storedAdmin?.mustChangePassword).toBe(true);
    expect(storedAdmin?.role).toBe("tournament_lead");
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
    requireAdminSession.mockResolvedValue(null);

    const response = await createAdmin(
      request({
        email: "admin@example.com",
      }),
    );

    expect(response.status).toBe(401);
  });

  it("rejects tournament lead attempts to create another lead", async () => {
    requireAdminSession.mockResolvedValue({
      user: {
        id: "lead-id",
        role: "tournament_lead",
      },
    });

    const response = await createAdmin(
      request({
        email: "another-lead@example.com",
      }),
    );

    expect(response.status).toBe(403);
  });

  it("lets a super admin remove another tournament lead", async () => {
    const owner = await User.create({
      email: "owner@example.com",
      passwordHash: await bcrypt.hash("owner-password", 4),
      role: "admin",
    });
    const lead = await User.create({
      email: "lead@example.com",
      passwordHash: await bcrypt.hash("lead-password", 4),
      role: "tournament_lead",
    });
    requireAdminSession.mockResolvedValue({
      user: {
        id: owner._id.toString(),
        role: "admin",
      },
    });

    const response = await deleteAdmin(lead._id.toString());

    expect(response.status).toBe(204);
    await expect(User.findById(lead._id)).resolves.toBeNull();
    await expect(User.findById(owner._id)).resolves.not.toBeNull();
  });

  it("rejects removing the active super admin session", async () => {
    const owner = await User.create({
      email: "owner@example.com",
      passwordHash: await bcrypt.hash("owner-password", 4),
      role: "admin",
    });
    requireAdminSession.mockResolvedValue({
      user: {
        id: owner._id.toString(),
        role: "admin",
      },
    });

    const response = await deleteAdmin(owner._id.toString());

    expect(response.status).toBe(409);
    await expect(User.findById(owner._id)).resolves.not.toBeNull();
  });

  it("rejects tournament lead attempts to remove leads or admins", async () => {
    const owner = await User.create({
      email: "owner@example.com",
      passwordHash: await bcrypt.hash("owner-password", 4),
      role: "admin",
    });
    const lead = await User.create({
      email: "lead@example.com",
      passwordHash: await bcrypt.hash("lead-password", 4),
      role: "tournament_lead",
    });
    requireAdminSession.mockResolvedValue({
      user: {
        id: lead._id.toString(),
        role: "tournament_lead",
      },
    });

    const leadResponse = await deleteAdmin(lead._id.toString());
    const ownerResponse = await deleteAdmin(owner._id.toString());

    expect(leadResponse.status).toBe(403);
    expect(ownerResponse.status).toBe(403);
    await expect(User.findById(lead._id)).resolves.not.toBeNull();
    await expect(User.findById(owner._id)).resolves.not.toBeNull();
  });
});
