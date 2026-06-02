import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Raro Volleyball Tournament",
  description: "Create and follow live volleyball tournament brackets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

