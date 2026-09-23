"use client";

import Image from "next/image";
import { HERO_CHARACTER, PERSON_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ClientAgentAvatarProps {
  size?: "sm" | "md";
  pulse?: boolean;
  className?: string;
}

const sizes = {
  sm: "h-11 w-11",
  md: "h-14 w-14",
} as const;

export function ClientAgentAvatar({
  size = "md",
  pulse = false,
  className,
}: ClientAgentAvatarProps) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-full border border-white/20 bg-surface shadow-[0_0_18px_rgb(139_92_246_/_0.35)]",
        sizes[size],
        className,
      )}
    >
      {pulse ? (
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-pulse rounded-full bg-accent/15 motion-reduce:animate-none"
        />
      ) : null}
      <Image
        src={HERO_CHARACTER}
        alt=""
        aria-hidden="true"
        width={112}
        height={112}
        className="h-full w-full object-cover object-[50%_12%]"
      />
      <span className="sr-only">{PERSON_NAME} AI assistant avatar</span>
    </span>
  );
}
