import { getServerSession } from "next-auth";
import { AdminSidebar } from "@/components/ui/AdminSidebar";
import { authOptions } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return children;
  }

  return (
    <div className="min-h-screen md:flex">
      <AdminSidebar />
      <main className="min-w-0 flex-1 px-4 py-8 md:px-8">{children}</main>
    </div>
  );
}

