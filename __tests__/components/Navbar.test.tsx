import { renderToStaticMarkup } from "react-dom/server";
import { Navbar } from "@/components/ui/Navbar";

describe("Navbar", () => {
  it("links unauthenticated users to the admin login", () => {
    const markup = renderToStaticMarkup(<Navbar isAuthenticated={false} />);

    expect(markup).toContain('href="/admin/login"');
    expect(markup).toContain("Admin login");
  });

  it("links authenticated users to the dashboard", () => {
    const markup = renderToStaticMarkup(<Navbar isAuthenticated />);

    expect(markup).toContain('href="/admin/dashboard"');
    expect(markup).toContain("Dashboard");
  });
});

