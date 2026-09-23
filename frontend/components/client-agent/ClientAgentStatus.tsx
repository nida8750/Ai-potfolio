"use client";

import { cn } from "@/lib/utils";

interface ClientAgentStatusProps {
  backendOn: boolean | null;
}

export function ClientAgentStatus({ backendOn }: ClientAgentStatusProps) {
  const label =
    backendOn == null
      ? "Checking assistant status"
      : backendOn
        ? "AI assistant online"
        : "Local portfolio guide";

  return (
    <p
      className={cn(
        "mt-1 flex items-center gap-1.5 text-[11px]",
        backendOn ? "text-emerald-300" : "text-muted",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full",
          backendOn ? "bg-emerald-300 shadow-[0_0_8px_rgb(110_231_183)]" : "bg-muted",
        )}
      />
      {label}
    </p>
  );
}
