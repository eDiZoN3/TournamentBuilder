import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import AdminLayout from "@/app/admin/layout";
import PublicLayout from "@/app/(public)/layout";

const { getServerSession } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession,
}));

describe("application layouts", () => {
  it("uses a wide public content area for bracket readability", async () => {
    getServerSession.mockResolvedValue(null);

    const markup = renderToStaticMarkup(
      await PublicLayout({
        children: <div>Content</div>,
      }),
    );

    expect(markup).toContain("max-w-[1800px]");
  });

  it("keeps authenticated admin content unconstrained and horizontally stable", async () => {
    getServerSession.mockResolvedValue({ user: { role: "admin" } });

    const markup = renderToStaticMarkup(
      await AdminLayout({
        children: <div>Admin content</div>,
      }),
    );

    expect(markup).toContain("flex-1");
    expect(markup).toContain("min-w-0");
  });
});
