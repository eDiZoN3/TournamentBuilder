// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ChangePasswordPage from "@/app/admin/change-password/page";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

const { useSession } = await import("next-auth/react");
const mockedUseSession = vi.mocked(useSession);
const mockedUseRouter = vi.mocked(useRouter);
const push = vi.fn();
const update = vi.fn().mockResolvedValue(null);

describe("ChangePasswordPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    push.mockReset();
    update.mockReset().mockResolvedValue(null);
    mockedUseRouter.mockReturnValue({ push } as never);
    mockedUseSession.mockReturnValue({ update } as never);
  });

  it("submits a password change and redirects to the dashboard", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ mustChangePassword: false, role: "admin" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ChangePasswordPage />);

    fireEvent.change(screen.getByLabelText("Current password"), {
      target: { value: "temporary1" },
    });
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "new-password" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "new-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Change password" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/admin/change-password", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: "temporary1",
          newPassword: "new-password",
          confirmPassword: "new-password",
        }),
      });
      expect(update).toHaveBeenCalledWith({ mustChangePassword: false });
      expect(push).toHaveBeenCalledWith("/admin/dashboard");
    });
  });

  it("redirects players back to their account after changing a reset password", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ mustChangePassword: false, role: "player" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ChangePasswordPage />);

    fireEvent.change(screen.getByLabelText("Current password"), {
      target: { value: "temporary1" },
    });
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "player-password" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "player-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Change password" }));

    await waitFor(() => {
      expect(update).toHaveBeenCalledWith({ mustChangePassword: false });
      expect(push).toHaveBeenCalledWith("/account");
    });
  });

  it("shows API errors inline", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Current password is incorrect" }),
      }),
    );

    render(<ChangePasswordPage />);

    fireEvent.change(screen.getByLabelText("Current password"), {
      target: { value: "wrong-password" },
    });
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "new-password" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "new-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Change password" }));

    expect(
      await screen.findByText("Current password is incorrect"),
    ).toBeInTheDocument();
  });
});
