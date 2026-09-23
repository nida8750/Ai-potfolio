import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export function AutomationBadge({ className }: { className?: string }) {
  return (
    <Badge variant="blue" className={cn("gap-1.5", className)}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
      n8n
    </Badge>
  );
}
