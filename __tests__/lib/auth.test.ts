import bcrypt from "bcryptjs";
import type { CredentialsConfig } from "next-auth/providers/credentials";
import { authOptions } from "@/lib/auth";
import { PlayerProfile } from "@/lib/models/PlayerProfile";
import { User } from "@/lib/models/User";

function getAuthorize() {
  const provider = authOptions.providers[0] as CredentialsConfig;

  if (!provider.options?.authorize) {
    throw new Error("Credentials authorize handler is not configured");
  }

  return provider.options.authorize;
}

describe("credentials authentication", () => {
  it("returns the admin for valid credentials", async () => {
    const passwordHash = await bcrypt.hash("correct-password", 4);
    const user = await User.create({
      email: "admin@example.com",
      mustChangePassword: true,
      passwordHash,
    });

    const authenticatedUser = await getAuthorize()(
      {
        email: " ADMIN@EXAMPLE.COM ",
        password: "correct-password",
      },
      {},
    );

    expect(authenticatedUser).toMatchObject({
      id: user._id.toString(),
      email: "admin@example.com",
      mustChangePassword: true,
      role: "admin",
    });
  });

  it("returns null for an incorrect password", async () => {
    const passwordHash = await bcrypt.hash("correct-password", 4);
    await User.create({
      email: "admin@example.com",
      passwordHash,
    });

    const authenticatedUser = await getAuthorize()(
      {
        email: "admin@example.com",
        password: "incorrect-password",
      },
      {},
    );

    expect(authenticatedUser).toBeNull();
  });

  it("returns player profile identity for valid player credentials", async () => {
    const passwordHash = await bcrypt.hash("player-password", 4);
    const user = await User.create({
      email: "player@example.com",
      passwordHash,
      role: "player",
    });
    const profile = await PlayerProfile.create({
      userId: user._id,
      firstName: "Alice",
      surname: "Example",
      displayName: "Alice Example",
      email: "player@example.com",
    });

    const authenticatedUser = await getAuthorize()(
      {
        email: "player@example.com",
        password: "player-password",
      },
      {},
    );

    expect(authenticatedUser).toMatchObject({
      id: user._id.toString(),
      email: "player@example.com",
      playerDisplayName: "Alice Example",
      playerProfileId: profile._id.toString(),
      role: "player",
    });
  });

  it("returns null for an unknown user", async () => {
    const authenticatedUser = await getAuthorize()(
      {
        email: "missing@example.com",
        password: "incorrect-password",
      },
      {},
    );

    expect(authenticatedUser).toBeNull();
  });

  it("returns null when required credentials are missing", async () => {
    const authenticatedUser = await getAuthorize()({}, {});

    expect(authenticatedUser).toBeNull();
  });

  it("stores the authenticated admin in JWT and session callbacks", async () => {
    const jwt = authOptions.callbacks?.jwt;
    const session = authOptions.callbacks?.session;

    expect(jwt).toBeDefined();
    expect(session).toBeDefined();

    const token = await jwt!({
      token: {},
      user: {
        id: "admin-id",
        email: "admin@example.com",
        mustChangePassword: true,
        playerDisplayName: undefined,
        playerProfileId: undefined,
        role: "admin",
      },
      account: null,
      profile: undefined,
      trigger: "signIn",
      isNewUser: false,
    });

    expect(token).toMatchObject({
      id: "admin-id",
      mustChangePassword: true,
      role: "admin",
    });

    const authenticatedSession = await session!({
      session: {
        user: {
          id: "",
          email: "admin@example.com",
          mustChangePassword: false,
          role: "admin",
        },
        expires: new Date(Date.now() + 60_000).toISOString(),
      },
      token,
      user: {
        id: "admin-id",
        email: "admin@example.com",
        emailVerified: null,
        mustChangePassword: true,
        role: "admin",
      },
      newSession: undefined,
      trigger: "update",
    });

    expect(authenticatedSession.user).toMatchObject({
      id: "admin-id",
      mustChangePassword: true,
      role: "admin",
    });
  });
});
