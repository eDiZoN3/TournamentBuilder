import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { LocaleProvider } from "@/components/ui/LocaleProvider";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { LOCALE_STORAGE_KEY } from "@/lib/i18n";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import "./globals.css";
import "./themes/index.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tournament Manager",
  description: "Create and Track Custom Tournaments",
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
      className={`light ${inter.variable}`}
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
