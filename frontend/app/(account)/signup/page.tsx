import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/account/SignupForm";
import { getCurrentUser } from "@/lib/auth/server";
import { GlassCard } from "@/components/ui/GlassCard";
import { postLoginPath } from "@/lib/security/redirect";

export const metadata: Metadata = {
  title: "Create an account | Nida AI",
  description: "Create a Nida AI account to request services and track orders.",
  robots: { index: false, follow: false },
};

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(postLoginPath(user.role, null));
  }

  return (
    <GlassCard className="p-6 md:p-8">
      <h1 className="font-display text-2xl text-foreground">Create an account</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        Track your inquiries, service requests, and order status in one place.
      </p>
      <SignupForm />
      <p className="mt-6 text-sm text-muted">
        Already registered?{" "}
        <Link href="/login" className="text-accent hover:text-foreground">
          Sign in
        </Link>
      </p>
    </GlassCard>
  );
}
