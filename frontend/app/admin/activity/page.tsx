import { PageHeader } from "@/components/app/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireAdminOrRedirect } from "@/lib/auth/guards";
import { repository } from "@/lib/data/repository";
import { formatDateTime, shortId } from "@/lib/format";

export default async function AdminActivityPage() {
  await requireAdminOrRedirect("/admin/activity");
  const [logs, users] = await Promise.all([
    repository.listAuditLogs(),
    repository.listUsers(),
  ]);

  const nameFor = new Map(users.map((user) => [user.id, user.name]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity"
        description="Audit trail of administrative changes. Secrets and payment details are never recorded."
      />

      {logs.length === 0 ? (
        <EmptyState
          title="No activity recorded"
          description="Administrative actions such as editing a service or changing an order status are logged here."
        />
      ) : (
        <DataTable
          caption="Audit log"
          headers={["When", "Actor", "Action", "Entity", "Details"]}
        >
          {logs.slice(0, 200).map((log) => (
            <tr key={log.id}>
              <td className="whitespace-nowrap px-4 py-3 text-muted">
                {formatDateTime(log.createdAt)}
              </td>
              <td className="px-4 py-3 text-foreground">
                {nameFor.get(log.actorId) ?? shortId(log.actorId)}
              </td>
              <td className="px-4 py-3 text-foreground">{log.action}</td>
              <td className="px-4 py-3 text-muted">
                {log.entityType} {shortId(log.entityId)}
              </td>
              <td className="px-4 py-3 text-muted">
                {log.metadata
                  ? Object.entries(log.metadata)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(", ")
                  : "—"}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
