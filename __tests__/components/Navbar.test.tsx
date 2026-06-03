import { renderToStaticMarkup } from "react-dom/server";
import { Navbar } from "@/components/ui/Navbar";

describe("Navbar", () => {
  it("links unauthenticated users to the admin login", () => {
    const markup = renderToStaticMarkup(<Navbar isAuthenticated={false} />);

    expect(markup).toContain('href="/admin/login"');
    expect(markup).toContain("Admin login");
    expect(markup).toContain('href="/signup"');
    expect(markup).toContain("Sign up");
    expect(markup).toContain('href="/stats"');
    expect(markup).toContain("Stats");
  });

  it("links authenticated users to the dashboard", () => {
    const markup = renderToStaticMarkup(
      <Navbar isAuthenticated role="admin" />,
    );

    expect(markup).toContain('href="/admin/dashboard"');
    expect(markup).toContain("Dashboard");
  });

  it("links authenticated players to their account", () => {
    const markup = renderToStaticMarkup(
      <Navbar isAuthenticated role="player" />,
    );

    expect(markup).toContain('href="/account"');
    expect(markup).toContain("Account");
  });
});

