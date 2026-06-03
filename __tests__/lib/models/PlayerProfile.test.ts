import { Types } from "mongoose";
import { PlayerProfile } from "@/lib/models/PlayerProfile";

describe("PlayerProfile model", () => {
  it("stores player identity linked to a user", async () => {
    const userId = new Types.ObjectId();
    const profile = await PlayerProfile.create({
      userId,
      firstName: " Alice ",
      surname: " Example ",
      displayName: "Alice Example",
      email: " ALICE@Example.COM ",
    });

    expect(profile.userId.toString()).toBe(userId.toString());
    expect(profile.firstName).toBe("Alice");
    expect(profile.surname).toBe("Example");
    expect(profile.displayName).toBe("Alice Example");
    expect(profile.email).toBe("alice@example.com");
  });

  it("rejects duplicate profile emails", async () => {
    await PlayerProfile.syncIndexes();

    await PlayerProfile.create({
      userId: new Types.ObjectId(),
      firstName: "Alice",
      displayName: "Alice",
      email: "alice@example.com",
    });

    await expect(
      PlayerProfile.create({
        userId: new Types.ObjectId(),
        firstName: "Alice",
        displayName: "Alice 2",
        email: "ALICE@example.com",
      }),
    ).rejects.toMatchObject({ code: 11000 });
  });
});
