import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlayerProfile } from "@/lib/models/PlayerProfile";
import { User } from "@/lib/models/User";

const { requireAdmin, requireStrictAdmin } = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  requireStrictAdmin: vi.fn(),
}));

vi.mock("@/lib/adminAuth", () => ({
  requireAdmin,
  requireStrictAdmin,
}));

import {
  GET as listPlayers,
  POST as createPlayer,
} from "@/app/api/admin/players/route";
import { POST as resetPlayerPassword } from "@/app/api/admin/players/[id]/reset-password/route";

function request(url: string, body?: Record<string, unknown>) {
  return new NextRequest(url, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
    headers: body
      ? {
          "content-type": "application/json",
        }
      : undefined,
  });
}

async function createStoredPlayer() {
  const user = await User.create({
    email: "alice@example.com",
    mustChangePassword: false,
    passwordHash: await bcrypt.hash("old-password", 4),
    role: "player",
  });
  const profile = await PlayerProfile.create({
    userId: user._id,
    firstName: "Alice",
    surname: "Example",
    displayName: "Alice Example",
    email: "alice@example.com",
  });

  return { profile, user };
}

describe("/api/admin/players", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    requireAdmin.mockResolvedValue(true);
    requireStrictAdmin.mockReset();
    requireStrictAdmin.mockResolvedValue(true);
  });

  it("lists player accounts without password hashes", async () => {
    await createStoredPlayer();

    const response = await listPlayers();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.players).toEqual([
      expect.objectContaining({
        _id: expect.any(String),
        userId: expect.any(String),
        displayName: "Alice Example",
        email: "alice@example.com",
        firstName: "Alice",
        surname: "Example",
        mustChangePassword: false,
        createdAt: expect.any(String),
      }),
    ]);
    expect(JSON.stringify(body)).not.toContain("passwordHash");
  });

  it("creates a player with a one-time temporary password", async () => {
    const response = await createPlayer(
      request("http://localhost:3000/api/admin/players", {
        email: " BOB@EXAMPLE.COM ",
        firstName: " Bob ",
        surname: " Builder ",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      player: {
        _id: expect.any(String),
        userId: expect.any(String),
        displayName: "Bob Builder",
        email: "bob@example.com",
        firstName: "Bob",
        surname: "Builder",
        mustChangePassword: true,
      },
      temporaryPassword: expect.any(String),
    });
    expect(body.temporaryPassword).toHaveLength(10);

    const storedUser = await User.findOne({ email: "bob@example.com" });
    const storedProfile = await PlayerProfile.findOne({ email: "bob@example.com" });

    expect(storedUser?.role).toBe("player");
    expect(storedUser?.mustChangePassword).toBe(true);
    expect(storedProfile?.userId.toString()).toBe(storedUser?._id.toString());
    await expect(
      bcrypt.compare(body.temporaryPassword, storedUser!.passwordHash),
    ).resolves.toBe(true);
  });

  it("rejects duplicate player emails", async () => {
    await createStoredPlayer();

    const response = await createPlayer(
      request("http://localhost:3000/api/admin/players", {
        email: "ALICE@example.com",
        firstName: "Alice",
      }),
    );

    expect(response.status).toBe(409);
  });

  it("requires an admin session", async () => {
    requireAdmin.mockResolvedValue(false);

    const response = await createPlayer(
      request("http://localhost:3000/api/admin/players", {
        email: "bob@example.com",
        firstName: "Bob",
      }),
    );

    expect(response.status).toBe(401);
  });
});

describe("/api/admin/players/[id]/reset-password", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    requireAdmin.mockResolvedValue(true);
    requireStrictAdmin.mockReset();
    requireStrictAdmin.mockResolvedValue(true);
  });

  it("resets a player password and forces a password change", async () => {
    const { profile, user } = await createStoredPlayer();

    const response = await resetPlayerPassword(
      request(
        `http://localhost:3000/api/admin/players/${profile._id.toString()}/reset-password`,
      ),
      {
        params: Promise.resolve({ id: profile._id.toString() }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      player: {
        _id: profile._id.toString(),
        email: "alice@example.com",
        mustChangePassword: true,
      },
      temporaryPassword: expect.any(String),
    });
    expect(body.temporaryPassword).toHaveLength(10);

    const updatedUser = await User.findById(user._id);

    expect(updatedUser?.mustChangePassword).toBe(true);
    await expect(
      bcrypt.compare(body.temporaryPassword, updatedUser!.passwordHash),
    ).resolves.toBe(true);
    await expect(
      bcrypt.compare("old-password", updatedUser!.passwordHash),
    ).resolves.toBe(false);
  });

  function resetRequest(id: string) {
    return resetPlayerPassword(
      request(
        `http://localhost:3000/api/admin/players/${id}/reset-password`,
      ),
      { params: Promise.resolve({ id }) },
    );
  }

  it("requires an authenticated admin", async () => {
    requireAdmin.mockResolvedValue(false);

    const response = await resetRequest(new Types.ObjectId().toString());

    expect(response.status).toBe(401);
  });

  it("returns 404 for a malformed player id", async () => {
    const response = await resetRequest("not-a-valid-id");

    expect(response.status).toBe(404);
  });

  it("returns 404 when no player profile exists", async () => {
    const response = await resetRequest(new Types.ObjectId().toString());

    expect(response.status).toBe(404);
  });

  it("returns 404 when the profile has no matching player user", async () => {
    const profile = await PlayerProfile.create({
      userId: new Types.ObjectId(),
      firstName: "Ghost",
      surname: "Player",
      displayName: "Ghost Player",
      email: "ghost@example.com",
    });

    const response = await resetRequest(profile._id.toString());

    expect(response.status).toBe(404);
  });
});
