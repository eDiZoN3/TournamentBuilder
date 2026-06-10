// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LOCALE_STORAGE_KEY, translate, type TranslationKey } from "@/lib/i18n";
import { Navbar } from "@/components/ui/Navbar";

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

const NEW_KEYS: TranslationKey[] = [
  "tournamentGroups",
  "groups",
  "group",
  "newGroup",
  "groupName",
  "categories",
  "category",
  "addCategory",
  "categoryName",
  "startGroup",
  "groupLeaderboard",
  "totalScore",
  "idleWaitingForTeams",
  "nextQueuedMatch",
  "noGroupsYet",
];

describe("i18n new group keys", () => {
  it("all new keys exist in English and are non-empty", () => {
    for (const key of NEW_KEYS) {
      expect(translate("en", key), `en.${key} missing`).toBeTruthy();
    }
  });

  it("all new keys exist in German and are non-empty", () => {
    for (const key of NEW_KEYS) {
      expect(translate("de", key), `de.${key} missing`).toBeTruthy();
    }
  });
});

describe("Navbar groups link", () => {
  it("shows an Events link to the public groups page", () => {
    render(<Navbar isAuthenticated={false} />);

    const primaryNav = screen.getByRole("navigation", {
      name: /primary navigation/i,
    });
    const groupsLink = within(primaryNav).getByRole("link", { name: "Events" });

    expect(groupsLink).toBeInTheDocument();
    expect(groupsLink).toHaveAttribute("href", "/groups");
  });

  it("uses Events as the groups link label in both locales", async () => {
    expect(translate("en", "groups")).toBe("Events");
    expect(translate("de", "groups")).toBe("Events");

    render(<Navbar isAuthenticated={false} />);
    expect(screen.getAllByRole("link", { name: "Events" }).length).toBeGreaterThanOrEqual(1);

    window.localStorage.setItem(LOCALE_STORAGE_KEY, "de");
    const { LocaleProvider } = await import("@/components/ui/LocaleProvider");

    render(
      <LocaleProvider>
        <Navbar isAuthenticated={false} />
      </LocaleProvider>,
    );

    expect(screen.getAllByRole("link", { name: "Events" }).length).toBeGreaterThanOrEqual(1);
  });
});
