import Link from "next/link";
import type { ReactNode } from "react";
import { SignOutButton } from "@/components/app/SignOutButton";
import { AppNav } from "@/components/app/AppNav";
import { SITE_NAME } from "@/lib/constants";
import type { NavItem } from "@/types/navigation";

interface AppShellProps {
  kind: "dashboard" | "admin";
  userName: string;
  userRole: string;
  navItems: NavItem[];
  children: ReactNode;
}

export function AppShell({
  kind,
  userName,
  userRole,
  navItems,
  children,
}: AppShellProps) {
  const label = kind === "admin" ? "Admin console" : "Dashboard";

  return (
    <div className="min-h-dvh bg-[#070B18] lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <div className="border-b border-white/10 bg-surface/70 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 px-4 py-4 lg:px-5">
          <Link href="/" className="min-w-0">
            <span className="block font-display text-sm tracking-[0.22em] text-foreground">
              {SITE_NAME.toUpperCase()}
            </span>
            <span className="mt-0.5 block text-xs text-muted">{label}</span>
          </Link>
          {kind === "admin" ? (
            <Link
              href="/dashboard"
              className="shrink-0 text-xs text-muted hover:text-foreground lg:hidden"
            >
              Exit
            </Link>
          ) : null}
        </div>
        <AppNav items={navItems} />
        <div className="hidden border-t border-white/10 px-5 py-4 lg:block">
          <p className="truncate text-sm text-foreground">{userName}</p>
          <p className="text-xs text-muted">{userRole}</p>
          <SignOutButton className="mt-3" />
        </div>
      </div>

      <main id="main" className="min-w-0 px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto w-full max-w-[1080px]">{children}</div>
        <div className="mx-auto mt-10 w-full max-w-[1080px] lg:hidden">
          <SignOutButton />
        </div>
      </main>
    </div>
  );
}
