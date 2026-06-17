import { User } from "@/lib/models/User";

describe("User model", () => {
  it("normalizes email addresses and defaults the role to player", async () => {
    const user = await User.create({
      email: "  ADMIN@Example.COM ",
      passwordHash: "hashed-password",
    });

    expect(user.email).toBe("admin@example.com");
    expect(user.role).toBe("player");
  });

  it("rejects duplicate email addresses", async () => {
    await User.syncIndexes();

    await User.create({
      email: "admin@example.com",
      passwordHash: "hashed-password",
    });

    await expect(
      User.create({
        email: "ADMIN@example.com",
        passwordHash: "another-password",
      }),
    ).rejects.toMatchObject({ code: 11000 });
  });

  it("allows player roles", async () => {
    const user = await User.create({
      email: "player@example.com",
      passwordHash: "hashed-password",
      role: "player",
    });

    expect(user.role).toBe("player");
  });

  it("allows tournament lead roles for regular tournament managers", async () => {
    const user = await User.create({
      email: "lead@example.com",
      passwordHash: "hashed-password",
      role: "tournament_lead",
    });

    expect(user.role).toBe("tournament_lead");
  });

  it("rejects unsupported roles", async () => {
    await expect(
      User.create({
        email: "viewer@example.com",
        passwordHash: "hashed-password",
        role: "viewer",
      }),
    ).rejects.toThrow();
  });
});
