import bcrypt from "bcryptjs";
import { User } from "@/lib/models/User";
import { seedAdmin } from "@/scripts/seed-admin";

describe("seedAdmin", () => {
  it("creates an admin with a bcrypt hash", async () => {
    const result = await seedAdmin("admin@example.com", "strong-password");
    const user = await User.findOne({ email: "admin@example.com" });

    expect(result).toBe("created");
    expect(user).not.toBeNull();
    expect(user?.role).toBe("admin");
    expect(await bcrypt.compare("strong-password", user!.passwordHash)).toBe(
      true,
    );
  });

  it("does not overwrite an existing admin", async () => {
    await seedAdmin("admin@example.com", "first-password");

    const result = await seedAdmin("admin@example.com", "second-password");
    const user = await User.findOne({ email: "admin@example.com" });

    expect(result).toBe("exists");
    expect(await bcrypt.compare("first-password", user!.passwordHash)).toBe(
      true,
    );
  });
});

