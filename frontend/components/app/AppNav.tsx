"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types/navigation";

export function isActivePath(pathname: string, href: string, hrefs: string[]): boolean {
  const path = pathname.split("#")[0] ?? pathname;
  const clean = href.split("#")[0] ?? href;
  if (path === clean) {
    return true;
  }
  if (!clean || clean === "/" || !path.startsWith(`${clean}/`)) {
    return false;
  }
  return !hrefs.some((other) => {
    if (!other || other === clean) {
      return false;
    }
    return other.startsWith(`${clean}/`) && (path === other || path.startsWith(`${other}/`));
  });
}

export function AppNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const hrefs = items.map((item) => item.href.split("#")[0] ?? item.href);

  return (
    <nav aria-label="Section" className="px-3 pb-3 lg:px-3 lg:pb-5">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {items.map((item) => {
          const active = isActivePath(pathname ?? "/", item.href, hrefs);
          return (
            <li key={item.href} className="shrink-0 lg:shrink">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block whitespace-nowrap rounded-lg px-3 py-2 text-sm",
                  active
                    ? "bg-primary/15 text-foreground"
                    : "text-muted hover:bg-white/[0.04] hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
