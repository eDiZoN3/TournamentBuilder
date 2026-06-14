// @vitest-environment jsdom

import { fireEvent, render, screen, within } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminSidebar } from "@/components/ui/AdminSidebar";

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

const mockedSignOut = vi.mocked(signOut);
const mockedUsePathname = vi.mocked(usePathname);

describe("AdminSidebar", () => {
  beforeEach(() => {
    mockedSignOut.mockReset();
    mockedUsePathname.mockReturnValue("/admin/dashboard");
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
    expect(
      screen.queryByRole("link", { name: "Multi-Category Tournaments" }),
    ).not.toBeInTheDocument();
    expect(
      screen
        .queryAllByRole("link")
        .some((link) => link.getAttribute("href") === "/admin/groups"),
    ).toBe(false);
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
    expect(screen.getByLabelText("Switch to dark mode")).toBeInTheDocument();
  });


  it("can hide and restore the desktop sidebar on tournament management pages", () => {
    mockedUsePathname.mockReturnValue("/admin/tournament/abc123/manage");

    render(<AdminSidebar />);

    const sidebar = screen.getByTestId("admin-sidebar");
    const hideButton = screen.getByRole("button", { name: "Hide admin sidebar" });

    expect(sidebar).not.toHaveClass("md:hidden");

    fireEvent.click(hideButton);

    expect(sidebar).toHaveClass("md:hidden");
    const showButton = screen.getByRole("button", { name: "Show admin sidebar" });
    expect(showButton).toHaveClass("md:flex");

    fireEvent.click(showButton);

    expect(sidebar).not.toHaveClass("md:hidden");
  });

  it("logs out to the shared login page", () => {
    render(<AdminSidebar />);

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(mockedSignOut).toHaveBeenCalledWith({ callbackUrl: "/login", redirect: true });
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
