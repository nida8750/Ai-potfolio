"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

interface BackButtonProps {
  fallback?: string;
  label?: string;
}

function parentPath(pathname: string, fallback: string): string {
  const parts = pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  if (parts.length <= 1) {
    return fallback;
  }
  return `/${parts.slice(0, -1).join("/")}`;
}

export function BackButton({ fallback = "/", label = "Back" }: BackButtonProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";

  function goBack() {
    const next = parentPath(pathname, fallback);
    if (typeof window !== "undefined") {
      try {
        const referrer = document.referrer;
        if (referrer) {
          const url = new URL(referrer);
          if (url.origin === window.location.origin && url.pathname !== pathname) {
            router.back();
            return;
          }
        }
      } catch {
        // Use the parent path.
      }
    }
    router.push(next);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}
