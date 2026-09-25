"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard } from "lucide-react";

export function AdminDockButton() {
  const pathname = usePathname() ?? "/";
  const onAdmin =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/admin-login" ||
    pathname === "/login";

  if (onAdmin) {
    return null;
  }

  return (
    <Link
      href="/admin-login"
      className="fixed bottom-3 left-3 z-50 inline-flex items-center gap-2 rounded-full border border-white/15 bg-surface/95 px-4 py-2.5 text-sm font-semibold text-foreground shadow-[0_12px_32px_rgb(0_0_0_/_0.4)] backdrop-blur-xl hover:border-primary/50 hover:text-primary sm:bottom-4 sm:left-4 lg:bottom-6 lg:left-6"
    >
      <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
      Admin dashboard
    </Link>
  );
}
