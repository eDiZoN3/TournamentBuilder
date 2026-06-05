import { redirect } from "next/navigation";

interface AdminLoginPageProps {
  searchParams?: Promise<{
    callbackUrl?: string;
  }>;
}

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const params = await searchParams;
  const callbackUrl = params?.callbackUrl;
  const destination = new URLSearchParams();

  if (callbackUrl) {
    destination.set("callbackUrl", callbackUrl);
  }

  redirect(`/login${destination.size ? `?${destination}` : ""}`);
}
