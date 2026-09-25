"use client";

import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { accountCta, adminCta, hireCta, navigation } from "@/data/navigation";
import { Button } from "@/components/ui/Button";
import { SITE_NAME } from "@/lib/constants";

function subscribe() {
  return () => undefined;
}

function clientSnapshot() {
  return true;
}

function serverSnapshot() {
  return false;
}

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  menuId: string;
  showAdmin?: boolean;
}

export function MobileMenu({
  open,
  onClose,
  menuId,
  showAdmin = true,
}: MobileMenuProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const isClient = useSyncExternalStore(
    subscribe,
    clientSnapshot,
    serverSnapshot,
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const root = document.getElementById(menuId);
      if (!root) {
        return;
      }

      const focusable = [
        ...root.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
      ];
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuId, onClose, open]);

  if (!isClient || !open) {
    return null;
  }

  return createPortal(
    <div
      id={menuId}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="flex flex-col"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        width: "100%",
        maxWidth: "100%",
        height: "100dvh",
        backgroundColor: "#050816",
        opacity: 1,
        transform: "none",
      }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-4 xs:px-5">
        <p
          id={titleId}
          className="min-w-0 truncate font-display text-sm tracking-[0.18em] text-foreground"
        >
          {SITE_NAME.toUpperCase()}
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 text-foreground"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <nav
        aria-label="Mobile"
        className="flex flex-1 flex-col justify-center overflow-y-auto px-5 pb-10"
      >
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={onClose}
                className="block rounded-xl px-2 py-3 font-display text-3xl text-foreground"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-10 space-y-3">
          <Button
            href={accountCta.href}
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={onClose}
          >
            {accountCta.label}
          </Button>
          {showAdmin ? (
            <Button
              href={adminCta.href}
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={onClose}
            >
              {adminCta.label}
            </Button>
          ) : null}
          <Button href={hireCta.href} size="lg" className="w-full" onClick={onClose}>
            {hireCta.label}
          </Button>
        </div>
      </nav>
    </div>,
    document.body,
  );
}
