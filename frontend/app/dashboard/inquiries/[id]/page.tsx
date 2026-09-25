import { notFound } from "next/navigation";
import { BackButton } from "@/components/app/BackButton";
import { PageHeader } from "@/components/app/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireAuthOrRedirect } from "@/lib/auth/guards";
import { repository } from "@/lib/data/repository";
import { formatDateTime, shortId } from "@/lib/format";

export default async function InquiryDetailPage({
  params,
}: PageProps<"/dashboard/inquiries/[id]">) {
  const user = await requireAuthOrRedirect("/dashboard/inquiries");
  const { id } = await params;
  const inquiry = await repository.getInquiry(id);

  if (!inquiry || inquiry.userId !== user.id) {
    notFound();
  }

  const service = inquiry.serviceId
    ? await repository.getService(inquiry.serviceId)
    : undefined;

  const rows: Array<[string, string]> = [
    ["Reference", shortId(inquiry.id)],
    ["Subject", inquiry.subject ?? "Inquiry"],
    ["Service", service?.title ?? "General inquiry"],
    ["Source", inquiry.source === "service_request" ? "Service request" : "Contact"],
    ["Email", inquiry.email],
    ["Phone", inquiry.phone ?? "—"],
    ["Received", formatDateTime(inquiry.createdAt)],
    ["Updated", formatDateTime(inquiry.updatedAt)],
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={inquiry.subject ?? "Inquiry"}
        description="The message you sent and its current status."
      />

      <BackButton fallback="/dashboard/inquiries" label="Back to inquiries" />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
        <GlassCard className="p-5">
          <h2 className="font-display text-lg text-foreground">Details</h2>
          <dl className="mt-4 space-y-3">
            {rows.map(([label, value]) => (
              <div key={label} className="flex flex-wrap justify-between gap-2">
                <dt className="text-sm text-muted">{label}</dt>
                <dd className="text-sm text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="font-display text-lg text-foreground">Status</h2>
          <div className="mt-4">
            <StatusBadge status={inquiry.status} />
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-5">
        <h2 className="font-display text-lg text-foreground">Message</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted">
          {inquiry.message}
        </p>
      </GlassCard>
    </div>
  );
}
