import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getToken = vi.fn();

vi.mock("next-auth/jwt", () => ({
  getToken,
}));

describe("admin middleware", () => {
  beforeEach(() => {
    getToken.mockReset();
  });

  it("allows access to the login page without a session", async () => {
    const { middleware } = await import("@/middleware");
    const response = await middleware(
      new NextRequest("http://localhost:3000/admin/login"),
    );

    expect(response.headers.get("location")).toBeNull();
    expect(getToken).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated admin requests to login", async () => {
    getToken.mockResolvedValue(null);
    const { middleware } = await import("@/middleware");
    const response = await middleware(
      new NextRequest(
        "http://localhost:3000/admin/tournament/123/manage?view=compact",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/admin/login?callbackUrl=%2Fadmin%2Ftournament%2F123%2Fmanage%3Fview%3Dcompact",
    );
  });

  it("allows authenticated admin requests", async () => {
    getToken.mockResolvedValue({ role: "admin" });
    const { middleware } = await import("@/middleware");
    const response = await middleware(
      new NextRequest("http://localhost:3000/admin/dashboard"),
    );

    expect(response.headers.get("location")).toBeNull();
  });
});

