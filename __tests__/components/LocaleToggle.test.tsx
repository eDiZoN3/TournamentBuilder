// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  LOCALE_STORAGE_KEY,
  LocaleProvider,
} from "@/components/ui/LocaleProvider";
import { LocaleToggle } from "@/components/ui/LocaleToggle";
import { translate } from "@/lib/i18n";

describe("LocaleToggle", () => {
  let storageEntries: Map<string, string>;

  beforeEach(() => {
    storageEntries = new Map();
    const storage = {
      clear: () => storageEntries.clear(),
      getItem: (key: string) => storageEntries.get(key) ?? null,
      removeItem: (key: string) => storageEntries.delete(key),
      setItem: (key: string, value: string) =>
        storageEntries.set(key, String(value)),
    };

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: storage,
    });
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: storage,
    });
    window.localStorage.clear();
    document.documentElement.lang = "";
    document.documentElement.removeAttribute("data-locale");
  });

  it("starts in English when no preference is stored", async () => {
    render(
      <LocaleProvider>
        <LocaleToggle />
      </LocaleProvider>,
    );

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("lang", "en");
      expect(document.documentElement).toHaveAttribute("data-locale", "en");
      expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en");
    });
    expect(
      screen.getByRole("button", {
        name: translate("en", "languageSwitchToGerman"),
      }),
    ).toBeInTheDocument();
  });

  it("loads a stored German preference and switches back to English", async () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, "de");

    render(
      <LocaleProvider>
        <LocaleToggle />
      </LocaleProvider>,
    );

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("lang", "de");
      expect(document.documentElement).toHaveAttribute("data-locale", "de");
      expect(
        screen.getByRole("button", {
          name: translate("de", "languageSwitchToEnglish"),
        }),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: translate("de", "languageSwitchToEnglish"),
      }),
    );

    expect(document.documentElement).toHaveAttribute("lang", "en");
    expect(document.documentElement).toHaveAttribute("data-locale", "en");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en");
  });

  it("persists German when toggled on", async () => {
    render(
      <LocaleProvider>
        <LocaleToggle />
      </LocaleProvider>,
    );

    await screen.findByRole("button", {
      name: translate("en", "languageSwitchToGerman"),
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: translate("en", "languageSwitchToGerman"),
      }),
    );

    expect(document.documentElement).toHaveAttribute("lang", "de");
    expect(document.documentElement).toHaveAttribute("data-locale", "de");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("de");
  });
});
