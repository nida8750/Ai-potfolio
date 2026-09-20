import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "header" | "footer" | "nav";
}

export function Container({
  children,
  className,
  as: Tag = "div",
}: ContainerProps) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full max-w-[1120px] px-4 xs:px-5 wide:px-6 md:px-8 hd:max-w-[1240px] fhd:max-w-[1320px]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
