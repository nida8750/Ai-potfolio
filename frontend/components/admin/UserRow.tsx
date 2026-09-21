"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { apiRequest, errorMessage } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import type { UserRole } from "@/types/user";

interface UserRowProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: "active" | "disabled";
    createdAt: string;
  };
  isSelf: boolean;
}

export function UserRow({ user, isSelf }: UserRowProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(body: Record<string, string>) {
    setPending(true);
    setError(null);

    try {
      await apiRequest(`/api/admin/users/${user.id}`, { method: "PATCH", json: body });
      router.refresh();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <tr>
      <td className="px-4 py-3">
        <span className="block text-foreground">{user.name}</span>
        <span className="block text-xs text-muted">
          Joined {formatDate(user.createdAt)}
        </span>
      </td>
      <td className="break-all px-4 py-3 text-muted">{user.email}</td>
      <td className="px-4 py-3">
        <StatusBadge status={user.role} />
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={user.status} />
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col items-end gap-1">
          {isSelf ? (
            <span className="text-xs text-muted">Your account</span>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                className="text-sm text-accent hover:text-foreground"
                disabled={pending}
                onClick={() =>
                  patch({ role: user.role === "ADMIN" ? "USER" : "ADMIN" })
                }
              >
                {user.role === "ADMIN" ? "Make user" : "Make admin"}
              </button>
              <button
                type="button"
                className="text-sm text-muted hover:text-foreground"
                disabled={pending}
                onClick={() =>
                  patch({ status: user.status === "active" ? "disabled" : "active" })
                }
              >
                {user.status === "active" ? "Disable" : "Enable"}
              </button>
            </div>
          )}
          {error ? <span className="text-xs text-red-300">{error}</span> : null}
        </div>
      </td>
    </tr>
  );
}
