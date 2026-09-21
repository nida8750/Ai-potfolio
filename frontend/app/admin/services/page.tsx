import { PageHeader } from "@/components/app/PageHeader";
import { ServiceManager } from "@/components/admin/ServiceManager";
import { requireAdminOrRedirect } from "@/lib/auth/guards";
import { repository } from "@/lib/data/repository";
import { env } from "@/lib/env";

export default async function AdminServicesPage() {
  await requireAdminOrRedirect("/admin/services");
  const services = await repository.listServices();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services"
        description="What the public services section offers. Only active services are shown on the site."
      />
      <ServiceManager
        initialServices={services}
        currencies={env.supportedCurrencies}
      />
    </div>
  );
}
