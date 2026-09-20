import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import { cn } from "@/lib/utils";

const variantClasses = {
  primary:
    "bg-gradient-to-r from-primary to-accent text-white shadow-[0_0_22px_rgb(139_92_246_/_0.28)] hover:shadow-[0_0_30px_rgb(56_189_248_/_0.28)]",
  secondary:
    "border border-white/15 bg-surface/60 text-foreground hover:border-accent/50 hover:bg-surface-secondary",
  ghost: "text-foreground hover:bg-white/[0.06]",
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
  icon?: ReactNode;
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

function omitKeys<T extends object, K extends keyof T>(
  obj: T,
  keys: readonly K[],
): Omit<T, K> {
  const clone = { ...obj };
  for (const key of keys) {
    delete clone[key];
  }
  return clone;
}

function buttonClasses(
  variant: Variant,
  size: Size,
  className: string | undefined,
) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[box-shadow,background-color,border-color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

export function Button(props: ButtonProps) {
  const variant = props.variant ?? "primary";
  const size = props.size ?? "md";
  const classes = buttonClasses(variant, size, props.className);
  const content = (
    <>
      {props.icon}
      {props.children}
    </>
  );

  if ("href" in props && typeof props.href === "string") {
    const { href, ...linkProps } = omitKeys(props, [
      "variant",
      "size",
      "className",
      "icon",
      "children",
    ]);
    return (
      <a href={href} className={classes} {...linkProps}>
        {content}
      </a>
    );
  }

  const buttonProps = omitKeys(props, [
    "variant",
    "size",
    "className",
    "icon",
    "children",
  ]);
  return (
    <button className={classes} {...buttonProps}>
      {content}
    </button>
  );
}
