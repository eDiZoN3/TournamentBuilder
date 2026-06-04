// @vitest-environment jsdom

import { fireEvent, render, screen, within } from "@testing-library/react";
import { signOut } from "next-auth/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminSidebar } from "@/components/ui/AdminSidebar";

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

const mockedSignOut = vi.mocked(signOut);

describe("AdminSidebar", () => {
  beforeEach(() => {
    mockedSignOut.mockReset();
  });

  it("renders dashboard navigation, public links, and logout", () => {
    render(<AdminSidebar />);

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/admin/dashboard",
    );
    expect(screen.getByRole("link", { name: "Public tournaments" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
    expect(screen.getByLabelText("Switch to dark mode")).toBeInTheDocument();
  });

  it("logs out to the shared login page", () => {
    render(<AdminSidebar />);

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(mockedSignOut).toHaveBeenCalledWith({ callbackUrl: "/login" });
  });

  it("opens and closes the mobile admin drawer", () => {
    render(<AdminSidebar />);

    const openButton = screen.getByRole("button", {
      name: "Open admin navigation",
    });

    expect(openButton).toHaveClass("md:hidden");
    expect(openButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(openButton);

    expect(openButton).toHaveAttribute("aria-expanded", "true");
    expect(
      within(screen.getByRole("navigation", { name: "Admin navigation" })).getByRole(
        "link",
        { name: "Dashboard" },
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close admin navigation" }));

    expect(openButton).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the mobile admin drawer with Escape", () => {
    render(<AdminSidebar />);

    const openButton = screen.getByRole("button", {
      name: "Open admin navigation",
    });

    fireEvent.click(openButton);
    fireEvent.keyDown(document, { key: "Escape" });

    expect(openButton).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the mobile admin drawer when clicking outside", () => {
    render(<AdminSidebar />);

    const openButton = screen.getByRole("button", {
      name: "Open admin navigation",
    });

    fireEvent.click(openButton);
    fireEvent.mouseDown(document.body);

    expect(openButton).toHaveAttribute("aria-expanded", "false");
  });
});
