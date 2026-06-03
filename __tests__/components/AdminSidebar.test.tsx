import { renderToStaticMarkup } from "react-dom/server";
import { vi } from "vitest";
import { AdminSidebar } from "@/components/ui/AdminSidebar";

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

describe("AdminSidebar", () => {
  it("renders dashboard navigation and logout", () => {
    const markup = renderToStaticMarkup(<AdminSidebar />);

    expect(markup).toContain('href="/admin/dashboard"');
    expect(markup).toContain("Dashboard");
    expect(markup).toContain("Log out");
    expect(markup).toContain("Switch to dark mode");
  });
});
