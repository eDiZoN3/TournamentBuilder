// @vitest-environment jsdom

import { fireEvent, render, screen, within } from "@testing-library/react";
import { signOut } from "next-auth/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Navbar } from "@/components/ui/Navbar";

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

const mockedSignOut = vi.mocked(signOut);

function linkHrefs(name: RegExp | string) {
  return screen
    .getAllByRole("link", { name })
    .map((link) => link.getAttribute("href"));
}

describe("Navbar", () => {
  beforeEach(() => {
    mockedSignOut.mockReset();
  });

  it("links anonymous users to the shared login page", () => {
    render(<Navbar isAuthenticated={false} />);

    expect(linkHrefs(/log in|sign in/i)).toContain("/login");
    expect(screen.queryByRole("link", { name: "Admin login" })).not.toBeInTheDocument();
    expect(linkHrefs("Sign up")).toContain("/signup");
    expect(linkHrefs("Stats")).toContain("/stats");
    expect(screen.getByLabelText("Switch to dark mode")).toBeInTheDocument();
  });

  it("keeps desktop navigation links visible on desktop", () => {
    render(<Navbar isAuthenticated={false} />);

    const desktopNav = screen.getByRole("navigation", {
      name: "Primary navigation",
    });

    expect(within(desktopNav).getByRole("link", { name: "Tournaments" })).toHaveClass(
      "md:inline-flex",
    );
    expect(within(desktopNav).getByRole("link", { name: "Stats" })).toHaveClass(
      "md:inline-flex",
    );
  });

  it("opens and closes the mobile hamburger menu", () => {
    render(<Navbar isAuthenticated={false} />);

    const menuButton = screen.getByRole("button", {
      name: "Open navigation menu",
    });

    expect(menuButton).toHaveClass("md:hidden");
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(menuButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("navigation", { name: "Mobile navigation" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close navigation menu" }));

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the mobile menu with Escape", () => {
    render(<Navbar isAuthenticated={false} />);

    const menuButton = screen.getByRole("button", {
      name: "Open navigation menu",
    });

    fireEvent.click(menuButton);
    fireEvent.keyDown(document, { key: "Escape" });

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the mobile menu when clicking outside", () => {
    render(<Navbar isAuthenticated={false} />);

    const menuButton = screen.getByRole("button", {
      name: "Open navigation menu",
    });

    fireEvent.click(menuButton);
    fireEvent.mouseDown(document.body);

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
  });

  it("links super admins and tournament leads to the dashboard", () => {
    const { rerender } = render(<Navbar isAuthenticated role="admin" />);

    expect(linkHrefs("Dashboard")).toContain("/admin/dashboard");

    rerender(<Navbar isAuthenticated role={"tournament_lead" as never} />);

    expect(linkHrefs("Dashboard")).toContain("/admin/dashboard");
  });

  it("logs admin-capable users out to the shared login page", () => {
    const { rerender } = render(<Navbar isAuthenticated role="admin" />);

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(mockedSignOut).toHaveBeenCalledWith({ callbackUrl: "/login" });

    mockedSignOut.mockClear();
    rerender(<Navbar isAuthenticated role={"tournament_lead" as never} />);
    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(mockedSignOut).toHaveBeenCalledWith({ callbackUrl: "/login" });
  });

  it("shows player account and logout actions only for player sessions", () => {
    const { rerender } = render(<Navbar isAuthenticated={false} />);

    expect(screen.queryByRole("button", { name: "Log out" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Practice matches" }),
    ).not.toBeInTheDocument();

    rerender(<Navbar isAuthenticated role="player" />);

    expect(linkHrefs("Account")).toContain("/account");
    expect(linkHrefs("Practice matches")).toContain(
      "/account#practice-matches",
    );

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(mockedSignOut).toHaveBeenCalledWith({ callbackUrl: "/login" });
  });
});
