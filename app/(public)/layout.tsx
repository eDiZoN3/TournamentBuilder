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
      <Navbar
        isAuthenticated={Boolean(session)}
        role={session?.user.role ?? null}
      />
      <main className="mx-auto w-full max-w-[1800px] px-4 py-8">
        {children}
      </main>
    </>
  );
}

