import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import RootLayout, { metadata } from "@/app/layout";
import { LOCALE_STORAGE_KEY } from "@/lib/i18n";
import { THEME_STORAGE_KEY } from "@/lib/theme";

vi.mock("next/font/google", () => ({
  Inter: () => ({
    variable: "font-inter",
  }),
}));

vi.mock("@/components/ui/LocaleProvider", () => ({
  LocaleProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="locale-provider">{children}</div>
  ),
}));

vi.mock("@/components/ui/ThemeProvider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}));

vi.mock("@/components/ui/Toast", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="toast-provider">{children}</div>
  ),
}));

describe("RootLayout", () => {
  it("defines the app metadata", () => {
    expect(metadata).toMatchObject({
      title: "Tournament Manager",
      description: "Create and Track Custom Tournaments",
    });
  });

  it("renders startup scripts and wraps children in shared providers", () => {
    const markup = renderToStaticMarkup(
      <RootLayout>
        <main>Bracket content</main>
      </RootLayout>,
    );

    expect(markup).toContain('lang="en"');
    expect(markup).toContain('data-theme="light"');
    expect(markup).toContain(THEME_STORAGE_KEY);
    expect(markup).toContain(LOCALE_STORAGE_KEY);
    expect(markup).toContain("locale-provider");
    expect(markup).toContain("theme-provider");
    expect(markup).toContain("toast-provider");
    expect(markup).toContain("Bracket content");
  });
});
