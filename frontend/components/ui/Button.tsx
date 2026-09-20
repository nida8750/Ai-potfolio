import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const variantClasses = {
  primary:
    "bg-purple text-white shadow-[0_0_24px_rgb(139_92_246_/_0.28)] hover:bg-[#7c4eed] hover:shadow-[0_0_32px_rgb(139_92_246_/_0.4)]",
  secondary:
    "border border-white/15 bg-white/[0.03] text-ink hover:border-blue/50 hover:bg-white/[0.06]",
  ghost: "text-ink hover:bg-white/[0.06]",
} as const;

const sizeClasses = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[15px]",
} as const;

type Variant = keyof typeof variantClasses;
type Size = keyof typeof sizeClasses;

interface SharedProps {
  children: ReactNode;
  className?: string;
  variant?: Variant;
  size?: Size;
}

type ButtonAsButton = SharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: undefined;
  };

type ButtonAsLink = SharedProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children"> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

function buttonClasses(
  variant: Variant,
  size: Size,
  className: string | undefined,
) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

export function Button(props: ButtonProps) {
  const { children, className, variant = "primary", size = "md" } = props;
  const classes = buttonClasses(variant, size, className);

  if ("href" in props && typeof props.href === "string") {
    const { href, variant: _variant, size: _size, ...linkProps } = props;
    return (
      <a href={href} className={classes} {...linkProps}>
        {children}
      </a>
    );
  }

  const { variant: _variant, size: _size, ...buttonProps } = props;
  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
