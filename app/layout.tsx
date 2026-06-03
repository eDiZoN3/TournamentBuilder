import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="light" data-theme="light" lang="en" suppressHydrationWarning>
      <body>
        <ThemeStartupScript />
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
