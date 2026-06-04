// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { getSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/react", () => ({
  getSession: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

const mockedGetSession = vi.mocked(getSession);
const mockedSignIn = vi.mocked(signIn);
const mockedUseRouter = vi.mocked(useRouter);
const mockedUseSearchParams = vi.mocked(useSearchParams);
const push = vi.fn();
const refresh = vi.fn();

async function renderSharedLoginPage(search = "") {
  mockedUseSearchParams.mockReturnValue(new URLSearchParams(search) as never);
  const { default: LoginPage } = await import("@/app/(public)/login/page");

  render(<LoginPage />);
}

async function submitLogin(email = "user@example.com") {
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "correct-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("shared login page", () => {
  beforeEach(() => {
    mockedGetSession.mockReset();
    mockedSignIn.mockReset();
    push.mockReset();
    refresh.mockReset();
    mockedUseRouter.mockReturnValue({ push, refresh } as never);
    mockedUseSearchParams.mockReturnValue(new URLSearchParams() as never);
  });

  it("redirects a super admin to the admin dashboard", async () => {
    mockedSignIn.mockResolvedValue({ ok: true } as never);
    mockedGetSession.mockResolvedValue({
      user: { role: "admin" },
    } as never);
    await renderSharedLoginPage();

    await submitLogin("admin@example.com");

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/admin/dashboard");
    });
  });

  it("redirects a tournament lead to the admin dashboard", async () => {
    mockedSignIn.mockResolvedValue({ ok: true } as never);
    mockedGetSession.mockResolvedValue({
      user: { role: "tournament_lead" },
    } as never);
    await renderSharedLoginPage();

    await submitLogin("lead@example.com");

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/admin/dashboard");
    });
  });

  it("redirects a player to the account page", async () => {
    mockedSignIn.mockResolvedValue({ ok: true } as never);
    mockedGetSession.mockResolvedValue({
      user: { role: "player" },
    } as never);
    await renderSharedLoginPage();

    await submitLogin("player@example.com");

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/account");
    });
  });

  it("preserves an admin callback URL for admin-capable users", async () => {
    mockedSignIn.mockResolvedValue({ ok: true } as never);
    mockedGetSession.mockResolvedValue({
      user: { role: "tournament_lead" },
    } as never);
    await renderSharedLoginPage("callbackUrl=/admin/tournament/123/manage");

    await submitLogin("lead@example.com");

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/admin/tournament/123/manage");
    });
  });

  it("ignores an unauthorized player callback to an admin page", async () => {
    mockedSignIn.mockResolvedValue({ ok: true } as never);
    mockedGetSession.mockResolvedValue({
      user: { role: "player" },
    } as never);
    await renderSharedLoginPage("callbackUrl=/admin/dashboard");

    await submitLogin("player@example.com");

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/account");
    });
  });

  it("preserves an allowed player account callback", async () => {
    mockedSignIn.mockResolvedValue({ ok: true } as never);
    mockedGetSession.mockResolvedValue({
      user: { role: "player" },
    } as never);
    await renderSharedLoginPage("callbackUrl=/account");

    await submitLogin("player@example.com");

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/account");
    });
  });

  it("shows one consistent inline error for invalid credentials", async () => {
    mockedSignIn.mockResolvedValue({ ok: false } as never);
    await renderSharedLoginPage();

    await submitLogin("missing@example.com");

    expect(
      await screen.findByText("Invalid email or password."),
    ).toBeInTheDocument();
  });
});
