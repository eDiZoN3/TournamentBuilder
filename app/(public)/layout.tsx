import { getServerSession } from "next-auth";
import { Navbar } from "@/components/ui/Navbar";
import { authOptions } from "@/lib/auth";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <>
      <Navbar isAuthenticated={Boolean(session)} />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </>
  );
}

