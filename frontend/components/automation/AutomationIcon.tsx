"use client";

import {
  GitBranch,
  Headphones,
  MailCheck,
  ReceiptText,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { AutomationIconName } from "@/data/automations";
import { cn } from "@/lib/utils";

const icons: Record<AutomationIconName, LucideIcon> = {
  GitBranch,
  MailCheck,
  ReceiptText,
  Headphones,
  Sparkles,
};

interface AutomationIconProps {
  name: AutomationIconName;
  accent: string;
  className?: string;
}

export function AutomationIcon({ name, accent, className }: AutomationIconProps) {
  const Icon = icons[name];
  return (
    <span
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]",
        className,
      )}
      style={{ boxShadow: `0 0 24px ${accent}33`, color: accent }}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </span>
  );
}
