import { Bot, Database, Mic, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";

function iconFor(name?: string) {
  const key = name?.trim().toLowerCase() ?? "";

  if (key === "rag" || key === "rag & knowledge systems" || key === "knowledge") {
    return (
      <Database aria-hidden="true" className="h-5 w-5" />
    );
  }

  if (key === "automation" || key === "business automation") {
    return <Workflow aria-hidden="true" className="h-5 w-5" />;
  }

  if (key === "voice" || key === "voice ai") {
    return <Mic aria-hidden="true" className="h-5 w-5" />;
  }

  return <Bot aria-hidden="true" className="h-5 w-5" />;
}

interface ServiceIconProps {
  name?: string;
  className?: string;
}

export function ServiceIcon({ name, className }: ServiceIconProps) {
  return (
    <span
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary shadow-[0_0_18px_rgb(139_92_246_/_0.2)] transition-colors duration-300 group-hover:border-accent/40 group-hover:bg-accent/10 group-hover:text-accent motion-reduce:transition-none",
        className,
      )}
    >
      {iconFor(name)}
    </span>
  );
}
