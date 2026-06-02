import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("deployment configuration", () => {
  it("documents all required environment variables", () => {
    const envTemplate = readFileSync(".env.local.template", "utf8");

    for (const key of [
      "MONGODB_URI",
      "NEXTAUTH_SECRET",
      "NEXTAUTH_URL",
      "ADMIN_EMAIL",
      "ADMIN_PASSWORD",
    ]) {
      expect(envTemplate).toMatch(new RegExp(`^${key}=.+`, "m"));
    }

    expect(envTemplate).toContain("10.0.0.111:27017");
    expect(envTemplate).toContain("32");
  });

  it("includes setup, verification, and deployment instructions", () => {
    const readme = readFileSync("README.md", "utf8");

    expect(readme).toContain("npm install");
    expect(readme).toContain("npm run seed:admin");
    expect(readme).toContain("npm run test:coverage");
    expect(readme).toContain("npm run build");
    expect(readme).toContain("MongoDB Atlas");
    expect(readme).toContain("NEXTAUTH_URL");
    expect(readme).toContain("/admin");
  });
});
