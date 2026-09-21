import { PageHeader } from "@/components/app/PageHeader";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { Alert } from "@/components/ui/Alert";
import { GlassCard } from "@/components/ui/GlassCard";
import { requireAdminOrRedirect } from "@/lib/auth/guards";
import { repository } from "@/lib/data/repository";
import { env } from "@/lib/env";
import { configuredProviders } from "@/lib/payments";

export default async function AdminSettingsPage() {
  await requireAdminOrRedirect("/admin/settings");
  const settings = await repository.getSettings();
  const providers = configuredProviders();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Platform defaults. Credentials themselves are supplied by the environment, never edited here."
      />

      <GlassCard className="p-5 md:p-6">
        <SettingsForm
          settings={settings}
          currencies={env.supportedCurrencies}
          configuredProviders={providers}
        />
      </GlassCard>

      <Alert tone="info">
        Payment provider availability differs by country. A provider can only be
        selected here once its credentials exist in the environment.
      </Alert>
    </div>
  );
}
