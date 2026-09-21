import { PageHeader } from "@/components/app/PageHeader";
import { StatusSelect } from "@/components/admin/StatusSelect";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireAdminOrRedirect } from "@/lib/auth/guards";
import { repository } from "@/lib/data/repository";
import { formatDate } from "@/lib/format";

const statusOptions = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "closed", label: "Closed" },
];

export default async function AdminInquiriesPage() {
  await requireAdminOrRedirect("/admin/inquiries");
  const inquiries = await repository.listInquiries();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inquiries"
        description="Messages submitted through the contact section, stored before any automation runs."
      />

      {inquiries.length === 0 ? (
        <EmptyState
          title="No inquiries yet"
          description="Submissions from the public contact form will be listed here."
        />
      ) : (
        <DataTable
          caption="Inquiries"
          headers={["From", "Message", "Source", "Received", "Status"]}
        >
          {inquiries.map((inquiry) => (
            <tr key={inquiry.id}>
              <td className="px-4 py-3 align-top">
                <span className="block font-medium text-foreground">{inquiry.name}</span>
                <span className="block break-all text-xs text-muted">{inquiry.email}</span>
                {inquiry.phone ? (
                  <span className="block text-xs text-muted">{inquiry.phone}</span>
                ) : null}
              </td>
              <td className="max-w-sm px-4 py-3 align-top text-muted">{inquiry.message}</td>
              <td className="px-4 py-3 align-top text-muted">
                {inquiry.source === "service_request" ? "Service request" : "Contact"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 align-top text-muted">
                {formatDate(inquiry.createdAt)}
              </td>
              <td className="px-4 py-3 align-top">
                <StatusSelect
                  endpoint={`/api/admin/inquiries/${inquiry.id}`}
                  field="status"
                  value={inquiry.status}
                  options={statusOptions}
                  label={`Status for inquiry from ${inquiry.name}`}
                />
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
