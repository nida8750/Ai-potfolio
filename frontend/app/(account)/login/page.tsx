import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/account/LoginForm";
import { getCurrentUser } from "@/lib/auth/server";
import { GlassCard } from "@/components/ui/GlassCard";

export const metadata: Metadata = {
  title: "Sign in | Nida AI",
  description: "Sign in to your Nida AI account to track inquiries and orders.",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  if (await getCurrentUser()) {
    redirect("/dashboard");
  }

  return (
    <GlassCard className="p-6 md:p-8">
      <h1 className="font-display text-2xl text-foreground">Sign in</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        Access your inquiries, orders, and notifications.
      </p>
      <LoginForm />
      <div className="mt-6 space-y-2 text-sm text-muted">
        <p>
          Need an account?{" "}
          <Link href="/signup" className="text-accent hover:text-foreground">
            Create one
          </Link>
        </p>
        <p>
          <Link href="/forgot-password" className="text-accent hover:text-foreground">
            Forgot your password?
          </Link>
        </p>
      </div>
    </GlassCard>
  );
}
