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

  it("redirects the stale admin login URL to the shared login page", async () => {
    const { middleware } = await import("@/middleware");
    const response = await middleware(
      new NextRequest(
        "http://localhost:3000/admin/login?callbackUrl=/admin/dashboard",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?callbackUrl=%2Fadmin%2Fdashboard",
    );
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
      "http://localhost:3000/login?callbackUrl=%2Fadmin%2Ftournament%2F123%2Fmanage%3Fview%3Dcompact",
    );
  });

  it("allows authenticated admin requests", async () => {
    getToken.mockResolvedValue({ mustChangePassword: false, role: "admin" });
    const { middleware } = await import("@/middleware");
    const response = await middleware(
      new NextRequest("http://localhost:3000/admin/dashboard"),
    );

    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects first-login admins to the password change page", async () => {
    getToken.mockResolvedValue({ mustChangePassword: true, role: "admin" });
    const { middleware } = await import("@/middleware");
    const response = await middleware(
      new NextRequest("http://localhost:3000/admin/dashboard"),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/admin/change-password?callbackUrl=%2Fadmin%2Fdashboard",
    );
  });

  it("allows first-login admins to access the password change page", async () => {
    getToken.mockResolvedValue({ mustChangePassword: true, role: "admin" });
    const { middleware } = await import("@/middleware");
    const response = await middleware(
      new NextRequest("http://localhost:3000/admin/change-password"),
    );

    expect(response.headers.get("location")).toBeNull();
  });

  it("allows authenticated tournament lead requests", async () => {
    getToken.mockResolvedValue({
      mustChangePassword: false,
      role: "tournament_lead",
    });
    const { middleware } = await import("@/middleware");
    const response = await middleware(
      new NextRequest("http://localhost:3000/admin/dashboard"),
    );

    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects authenticated players away from admin pages", async () => {
    getToken.mockResolvedValue({ mustChangePassword: false, role: "player" });
    const { middleware } = await import("@/middleware");
    const response = await middleware(
      new NextRequest("http://localhost:3000/admin/dashboard"),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/account",
    );
  });
});

