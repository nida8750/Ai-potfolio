import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  // payment
  pending: "border-white/15 bg-white/[0.06] text-muted",
  processing: "border-accent/30 bg-accent/10 text-accent",
  paid: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  failed: "border-red-400/30 bg-red-400/10 text-red-200",
  refunded: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  cancelled: "border-white/15 bg-white/[0.04] text-muted",
  // order
  confirmed: "border-accent/30 bg-accent/10 text-accent",
  in_progress: "border-primary/30 bg-primary/10 text-primary",
  completed: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  // inquiry
  new: "border-primary/30 bg-primary/10 text-primary",
  closed: "border-white/15 bg-white/[0.04] text-muted",
  // user
  active: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  disabled: "border-red-400/30 bg-red-400/10 text-red-200",
  ADMIN: "border-primary/30 bg-primary/10 text-primary",
  USER: "border-white/15 bg-white/[0.06] text-muted",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize",
        tones[status] ?? "border-white/15 bg-white/[0.06] text-muted",
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
