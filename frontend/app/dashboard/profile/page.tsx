import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { ProfileForm } from "@/components/app/ProfileForm";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireAuthOrRedirect } from "@/lib/auth/guards";
import { toPublicUser } from "@/lib/data/presenters";
import { repository } from "@/lib/data/repository";
import { activeAuthProvider } from "@/lib/env";
import { formatDate } from "@/lib/format";

export default async function ProfilePage() {
  const user = await requireAuthOrRedirect("/dashboard/profile");
  const stored = await repository.getUser(user.id);
  if (!stored) {
    notFound();
  }

  const profile = toPublicUser(stored);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your account details. Passwords are handled by the identity provider, never stored here."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <GlassCard className="p-5 md:p-6">
          <h2 className="font-display text-lg text-foreground">Details</h2>
          <ProfileForm name={profile.name} phone={profile.phone ?? ""} />
        </GlassCard>

        <GlassCard className="p-5 md:p-6">
          <h2 className="font-display text-lg text-foreground">Account</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-muted">Email</dt>
              <dd className="break-all text-foreground">{profile.email}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted">Role</dt>
              <dd>
                <StatusBadge status={profile.role} />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted">Status</dt>
              <dd>
                <StatusBadge status={profile.status} />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted">Member since</dt>
              <dd className="text-foreground">{formatDate(profile.createdAt)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs leading-5 text-muted">
            {activeAuthProvider() === "supabase"
              ? "Credentials are managed by Supabase Auth."
              : activeAuthProvider() === "cognito"
                ? "Credentials are managed by AWS Cognito."
                : "Supabase and Cognito are not configured in this environment, so a local development credential store is used instead."}
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
