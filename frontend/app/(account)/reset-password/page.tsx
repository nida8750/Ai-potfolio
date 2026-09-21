import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/account/ResetPasswordForm";
import { GlassCard } from "@/components/ui/GlassCard";

export const metadata: Metadata = {
  title: "Set a new password | Nida AI",
  description: "Use your reset code to set a new Nida AI password.",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";

  return (
    <GlassCard className="p-6 md:p-8">
      <h1 className="font-display text-2xl text-foreground">Set a new password</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        Enter the reset code together with your new password.
      </p>
      <ResetPasswordForm defaultEmail={email} />
      <p className="mt-6 text-sm text-muted">
        <Link href="/login" className="text-accent hover:text-foreground">
          Back to sign in
        </Link>
      </p>
    </GlassCard>
  );
}
