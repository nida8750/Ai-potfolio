import { PageHeader } from "@/components/app/PageHeader";
import { UserRow } from "@/components/admin/UserRow";
import { DataTable } from "@/components/ui/DataTable";
import { requireAdminOrRedirect } from "@/lib/auth/guards";
import { repository } from "@/lib/data/repository";

export default async function AdminUsersPage() {
  const admin = await requireAdminOrRedirect("/admin/users");
  const users = await repository.listUsers();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Account records only. Passwords live with the identity provider and are never readable here."
      />

      <DataTable caption="Users" headers={["Name", "Email", "Role", "Status", ""]}>
        {users.map((user) => (
          <UserRow
            key={user.id}
            user={{
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              status: user.status,
              createdAt: user.createdAt,
            }}
            isSelf={user.id === admin.id}
          />
        ))}
      </DataTable>
    </div>
  );
}
