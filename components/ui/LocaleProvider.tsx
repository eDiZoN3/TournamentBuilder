"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  isLocale,
  LOCALE_STORAGE_KEY,
  translate,
  type Locale,
  type TranslationKey,
} from "@/lib/i18n";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
  toggleLocale: () => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  setLocale: () => undefined,
  t: (key) => translate("en", key),
  toggleLocale: () => undefined,
});

function readStoredLocale(): Locale {
  if (typeof window === "undefined") {
    return "en";
  }

  try {
    const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);

    return isLocale(storedLocale) ? storedLocale : "en";
  } catch {
    return "en";
  }
}

function persistLocale(locale: Locale) {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // A blocked storage write should not prevent the visible language switch.
  }
}

function applyLocale(locale: Locale) {
  document.documentElement.lang = locale;
  document.documentElement.dataset.locale = locale;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    applyLocale(nextLocale);
    persistLocale(nextLocale);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((currentLocale) => {
      const nextLocale = currentLocale === "de" ? "en" : "de";

      applyLocale(nextLocale);
      persistLocale(nextLocale);

      return nextLocale;
    });
  }, []);

  useEffect(() => {
    setLocale(readStoredLocale());
  }, [setLocale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: (key: TranslationKey) => translate(locale, key),
      toggleLocale,
    }),
    [locale, setLocale, toggleLocale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

export { LOCALE_STORAGE_KEY };
