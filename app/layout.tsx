import type { Metadata } from "next";
import { LocaleProvider } from "@/components/ui/LocaleProvider";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { LOCALE_STORAGE_KEY } from "@/lib/i18n";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Raro Volleyball Tournament",
  description: "Create and follow live volleyball tournament brackets.",
};

function ThemeStartupScript() {
  const script = `
(() => {
  try {
    var theme = window.localStorage.getItem("${THEME_STORAGE_KEY}");
    if (theme !== "dark" && theme !== "light") {
      theme = "light";
    }
    var root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(theme);
    root.dataset.theme = theme;
  } catch {
    document.documentElement.classList.add("light");
    document.documentElement.dataset.theme = "light";
  }
})();
`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

function LocaleStartupScript() {
  const script = `
(() => {
  try {
    var locale = window.localStorage.getItem("${LOCALE_STORAGE_KEY}");
    if (locale !== "de" && locale !== "en") {
      locale = "en";
    }
    document.documentElement.lang = locale;
    document.documentElement.dataset.locale = locale;
  } catch {
    document.documentElement.lang = "en";
    document.documentElement.dataset.locale = "en";
  }
})();
`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className="light"
      data-locale="en"
      data-theme="light"
      lang="en"
      suppressHydrationWarning
    >
      <body>
        <LocaleStartupScript />
        <ThemeStartupScript />
        <LocaleProvider>
          <ThemeProvider>
            <ToastProvider>{children}</ToastProvider>
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
