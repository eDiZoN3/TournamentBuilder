// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AdminUsersPanel,
  type AdminUserSummary,
} from "@/components/admin/AdminUsersPanel";

const admins: AdminUserSummary[] = [
  {
    _id: "owner-id",
    email: "owner@example.com",
    mustChangePassword: false,
    createdAt: "2026-06-01T12:00:00.000Z",
    role: "admin",
  },
  {
    _id: "lead-id",
    email: "lead@example.com",
    mustChangePassword: false,
    createdAt: "2026-06-02T12:00:00.000Z",
    role: "tournament_lead",
  },
] as unknown as AdminUserSummary[];

describe("AdminUsersPanel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("lists the seeded admin and creates a new tournament lead account", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        admin: {
          _id: "new-admin-id",
          email: "new-admin@example.com",
          mustChangePassword: true,
          createdAt: "2026-06-03T12:00:00.000Z",
          role: "tournament_lead",
        },
        temporaryPassword: "AbCdEf1234",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AdminUsersPanel initialAdmins={admins} />);

    expect(screen.getByText("owner@example.com")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("lead@example.com")).toBeInTheDocument();
    expect(screen.getByText("Tournament Lead")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("New tournament lead email"), {
      target: { value: "new-admin@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create tournament lead" }));

    expect(await screen.findByText("Temporary password")).toBeInTheDocument();
    expect(screen.getByText("AbCdEf1234")).toBeInTheDocument();
    expect(screen.getByText("new-admin@example.com")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/users", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: "new-admin@example.com",
      }),
    });
  });

  it("hides the generated password after dismissal", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          admin: {
            _id: "new-admin-id",
          email: "new-admin@example.com",
          mustChangePassword: true,
          createdAt: "2026-06-03T12:00:00.000Z",
          role: "tournament_lead",
        },
        temporaryPassword: "AbCdEf1234",
      }),
      }),
    );

    render(<AdminUsersPanel initialAdmins={admins} />);

    fireEvent.change(screen.getByLabelText("New tournament lead email"), {
      target: { value: "new-admin@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create tournament lead" }));

    expect(await screen.findByText("AbCdEf1234")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Dismiss temporary password" }));

    await waitFor(() => {
      expect(screen.queryByText("AbCdEf1234")).not.toBeInTheDocument();
    });
  });

  it("shows create failures inline", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Tournament lead email already exists" }),
      }),
    );

    render(<AdminUsersPanel initialAdmins={admins} />);

    fireEvent.change(screen.getByLabelText("New tournament lead email"), {
      target: { value: "owner@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create tournament lead" }));

    expect(
      await screen.findByText("Tournament lead email already exists"),
    ).toBeInTheDocument();
  });

  it("uses responsive container classes for the create-account card", () => {
    render(<AdminUsersPanel initialAdmins={admins} />);

    expect(
      screen.getByRole("region", { name: "Tournament lead accounts" }),
    ).toHaveClass("w-full", "max-w-full");
  });

  it("lets a super admin remove another tournament lead", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AdminUsersPanel initialAdmins={admins} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Remove lead@example.com" }),
    );

    await waitFor(() => {
      expect(screen.queryByText("lead@example.com")).not.toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/users/lead-id", {
      method: "DELETE",
    });
  });
});
