import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/account/AdminLoginForm";
import { getCurrentUser } from "@/lib/auth/server";
import { GlassCard } from "@/components/ui/GlassCard";
import { safeInternalPath } from "@/lib/security/redirect";

export const metadata: Metadata = {
  title: "Admin sign in | Nida AI",
  description: "Sign in with the admin Gmail and password to open the admin dashboard.",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: PageProps<"/admin-login">) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const next = safeInternalPath(typeof params.next === "string" ? params.next : null, "/admin");

  if (user?.role === "ADMIN") {
    redirect(next.startsWith("/admin") ? next : "/admin");
  }

  return (
    <GlassCard className="p-6 md:p-8">
      <h1 className="font-display text-2xl text-foreground">Admin dashboard</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        Enter the admin Gmail and password to open the console.
      </p>
      <AdminLoginForm />
      <p className="mt-6 text-sm text-muted">
        Customer account?{" "}
        <Link href="/login" className="text-accent hover:text-foreground">
          Sign in here
        </Link>
      </p>
    </GlassCard>
  );
}
