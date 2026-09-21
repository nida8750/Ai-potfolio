import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireAuthOrRedirect } from "@/lib/auth/guards";
import { repository } from "@/lib/data/repository";
import { formatDate, shortId } from "@/lib/format";

export default async function DashboardInquiriesPage() {
  const user = await requireAuthOrRedirect("/dashboard/inquiries");
  const inquiries = await repository.listInquiries(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inquiries"
        description="Requests you submitted while signed in, and how far along they are."
      />

      {inquiries.length === 0 ? (
        <EmptyState
          title="No inquiries yet"
          description="Inquiries you send from the contact section while signed in will be listed here."
          action={
            <Button href="/#contact" size="sm">
              Send an inquiry
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {inquiries.map((inquiry) => (
            <li key={inquiry.id}>
              <GlassCard className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {inquiry.subject ?? "Inquiry"}
                    </p>
                    <p className="text-xs text-muted">
                      {shortId(inquiry.id)} · {formatDate(inquiry.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={inquiry.status} />
                </div>
                <p className="mt-3 text-sm leading-6 text-muted">{inquiry.message}</p>
              </GlassCard>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
