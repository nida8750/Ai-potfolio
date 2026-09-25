import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/account/LoginForm";
import { Alert } from "@/components/ui/Alert";
import { getCurrentUser } from "@/lib/auth/server";
import { GlassCard } from "@/components/ui/GlassCard";
import { postLoginPath } from "@/lib/security/redirect";

export const metadata: Metadata = {
  title: "Sign in | Nida AI",
  description: "Sign in to your Nida AI account to track inquiries and orders.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const user = await getCurrentUser();
  if (user) {
    redirect(postLoginPath(user.role, null));
  }

  const params = await searchParams;
  const verified = params.verified === "1";
  const verifyFailed = params.error === "verify";

  return (
    <GlassCard className="p-6 md:p-8">
      <h1 className="font-display text-2xl text-foreground">Sign in</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        Access your inquiries, orders, and notifications.
      </p>
      {verified ? (
        <div className="mt-4">
          <Alert tone="info">Email verified. Sign in to continue.</Alert>
        </div>
      ) : null}
      {verifyFailed ? (
        <div className="mt-4">
          <Alert tone="error">
            Email verification uses a 6-digit code, not a Supabase link. Sign
            in or create an account to receive a new code.
          </Alert>
        </div>
      ) : null}
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
        <p>
          <Link href="/admin-login" className="text-accent hover:text-foreground">
            Admin dashboard
          </Link>
        </p>
      </div>
    </GlassCard>
  );
}
