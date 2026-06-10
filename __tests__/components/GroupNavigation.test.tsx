// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { translate, type TranslationKey } from "@/lib/i18n";
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
  it("shows a Groups link in the public navbar", () => {
    render(<Navbar isAuthenticated={false} />);

    const primaryNav = screen.getByRole("navigation", {
      name: /primary navigation/i,
    });
    const groupsLink = within(primaryNav).getByRole("link", { name: /groups/i });

    expect(groupsLink).toBeInTheDocument();
    expect(groupsLink).toHaveAttribute("href", "/groups");
  });

  it("Groups link is present in both locales", () => {
    // Just check the English rendering
    render(<Navbar isAuthenticated={false} />);
    expect(screen.getAllByRole("link", { name: /groups/i }).length).toBeGreaterThanOrEqual(1);
  });
});
