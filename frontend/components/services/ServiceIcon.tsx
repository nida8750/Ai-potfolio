import {
  AudioLines,
  Bot,
  Database,
  Layers,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  agents: Bot,
  rag: Database,
  automation: Workflow,
  voice: AudioLines,
  stack: Layers,
};

interface ServiceIconProps {
  name?: string;
  className?: string;
}

export function ServiceIcon({ name, className }: ServiceIconProps) {
  const Icon = (name && iconMap[name]) || Bot;

  return <Icon aria-hidden="true" className={cn("h-5 w-5", className)} />;
}
