import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { POST as signup } from "@/app/api/auth/signup/route";
import { PlayerProfile } from "@/lib/models/PlayerProfile";
import { User } from "@/lib/models/User";

function request(body?: Record<string, unknown>) {
  return new NextRequest("http://localhost:3000/api/auth/signup", {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
    headers: body
      ? {
          "content-type": "application/json",
        }
      : undefined,
  });
}

describe("/api/auth/signup", () => {
  it("creates a player account and linked profile", async () => {
    const response = await signup(
      request({
        firstName: " Alice ",
        surname: " Example ",
        email: " ALICE@Example.COM ",
        password: "player-password",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.player).toMatchObject({
      _id: expect.any(String),
      displayName: "Alice Example",
      email: "alice@example.com",
      firstName: "Alice",
      surname: "Example",
      userId: expect.any(String),
    });

    const user = await User.findOne({ email: "alice@example.com" });
    const profile = await PlayerProfile.findOne({ email: "alice@example.com" });

    expect(user?.role).toBe("player");
    expect(user?.mustChangePassword).toBe(false);
    expect(profile?.userId.toString()).toBe(user?._id.toString());
    await expect(
      bcrypt.compare("player-password", user!.passwordHash),
    ).resolves.toBe(true);
  });

  it("rejects duplicate player emails", async () => {
    await User.create({
      email: "alice@example.com",
      passwordHash: "hashed-password",
      role: "player",
    });

    const response = await signup(
      request({
        firstName: "Alice",
        email: "ALICE@example.com",
        password: "player-password",
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("rejects invalid signup details", async () => {
    const response = await signup(
      request({
        firstName: "",
        email: "not-an-email",
        password: "short",
      }),
    );

    expect(response.status).toBe(422);
  });
});
