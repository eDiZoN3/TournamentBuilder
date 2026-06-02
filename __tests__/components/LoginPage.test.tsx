// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { vi } from "vitest";
import AdminLoginPage from "@/app/admin/login/page";

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

const mockedSignIn = vi.mocked(signIn);
const mockedUseRouter = vi.mocked(useRouter);
const mockedUseSearchParams = vi.mocked(useSearchParams);
const push = vi.fn();
const refresh = vi.fn();

describe("AdminLoginPage", () => {
  beforeEach(() => {
    mockedSignIn.mockReset();
    push.mockReset();
    refresh.mockReset();
    mockedUseRouter.mockReturnValue({ push, refresh } as never);
    mockedUseSearchParams.mockReturnValue(new URLSearchParams() as never);
  });

  it("redirects valid credentials to the dashboard", async () => {
    mockedSignIn.mockResolvedValue({ ok: true } as never);
    render(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "correct-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(mockedSignIn).toHaveBeenCalledWith("credentials", {
        email: "admin@example.com",
        password: "correct-password",
        redirect: false,
      });
      expect(push).toHaveBeenCalledWith("/admin/dashboard");
    });
  });

  it("shows an inline error for invalid credentials", async () => {
    mockedSignIn.mockResolvedValue({ ok: false } as never);
    render(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrong-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByText("Invalid email or password."),
    ).toBeInTheDocument();
  });

  it("redirects to an internal callback URL after login", async () => {
    mockedSignIn.mockResolvedValue({ ok: true } as never);
    mockedUseSearchParams.mockReturnValue(
      new URLSearchParams("callbackUrl=/admin/tournament/123/manage") as never,
    );
    render(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "correct-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/admin/tournament/123/manage");
    });
  });

  it("shows an inline error when login cannot be reached", async () => {
    mockedSignIn.mockRejectedValue(new Error("network error"));
    render(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "correct-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByText("Unable to sign in. Please try again."),
    ).toBeInTheDocument();
  });
});
