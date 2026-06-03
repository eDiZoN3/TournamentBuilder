// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignupForm } from "@/components/player/SignupForm";

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

const mockedSignIn = vi.mocked(signIn);
const mockedUseRouter = vi.mocked(useRouter);
const push = vi.fn();
const refresh = vi.fn();

describe("SignupForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    push.mockReset();
    refresh.mockReset();
    mockedSignIn.mockReset();
    mockedUseRouter.mockReturnValue({ push, refresh } as never);
  });

  it("creates a player account, signs in, and opens the account page", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        player: {
          displayName: "Alice Example",
          email: "alice@example.com",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    mockedSignIn.mockResolvedValue({ ok: true } as never);

    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText("First name"), {
      target: { value: "Alice" },
    });
    fireEvent.change(screen.getByLabelText("Surname"), {
      target: { value: "Example" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "alice@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "player-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/auth/signup", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          firstName: "Alice",
          surname: "Example",
          email: "alice@example.com",
          password: "player-password",
        }),
      });
      expect(mockedSignIn).toHaveBeenCalledWith("credentials", {
        email: "alice@example.com",
        password: "player-password",
        redirect: false,
      });
      expect(push).toHaveBeenCalledWith("/account");
      expect(refresh).toHaveBeenCalled();
    });
  });

  it("shows signup errors inline", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Email already registered" }),
      }),
    );

    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText("First name"), {
      target: { value: "Alice" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "alice@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "player-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Email already registered")).toBeInTheDocument();
  });
});
