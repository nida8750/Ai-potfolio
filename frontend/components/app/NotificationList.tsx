"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { GlassCard } from "@/components/ui/GlassCard";
import { apiRequest, errorMessage } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format";
import type { AppNotification } from "@/types/notification";

export function NotificationList({
  notifications,
}: {
  notifications: AppNotification[];
}) {
  const [items, setItems] = useState(notifications);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function markRead(id: string) {
    setPendingId(id);
    setError(null);

    try {
      await apiRequest(`/api/notifications/${id}/read`, { method: "POST" });
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, read: true } : item)),
      );
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {error ? <Alert tone="error">{error}</Alert> : null}
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            <GlassCard className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {item.title}
                    {item.read ? null : (
                      <span className="ml-2 inline-block h-2 w-2 rounded-full bg-primary align-middle">
                        <span className="sr-only">Unread</span>
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted">{item.message}</p>
                  <p className="mt-1 text-xs text-muted">
                    {formatDateTime(item.createdAt)}
                  </p>
                </div>
                {item.read ? null : (
                  <button
                    type="button"
                    onClick={() => markRead(item.id)}
                    disabled={pendingId === item.id}
                    className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-xs text-muted hover:border-primary/40 hover:text-foreground disabled:opacity-60"
                  >
                    {pendingId === item.id ? "Saving…" : "Mark read"}
                  </button>
                )}
              </div>
            </GlassCard>
          </li>
        ))}
      </ul>
    </div>
  );
}
