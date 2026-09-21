import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/account/ForgotPasswordForm";
import { GlassCard } from "@/components/ui/GlassCard";

export const metadata: Metadata = {
  title: "Reset your password | Nida AI",
  description: "Request a reset code for your Nida AI account.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <GlassCard className="p-6 md:p-8">
      <h1 className="font-display text-2xl text-foreground">Forgot your password?</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        Enter your email and we will start the reset process.
      </p>
      <ForgotPasswordForm />
      <p className="mt-6 text-sm text-muted">
        <Link href="/login" className="text-accent hover:text-foreground">
          Back to sign in
        </Link>
      </p>
    </GlassCard>
  );
}
