"use client";

import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { hireCta, navigation } from "@/data/navigation";
import { Button } from "@/components/ui/Button";
import { overlayMotion } from "@/lib/animations";
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
}

export function MobileMenu({ open, onClose, menuId }: MobileMenuProps) {
  const reduceMotion = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const isClient = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!isClient) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          id={menuId}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed inset-0 z-[100] flex w-full max-w-full flex-col overflow-x-hidden bg-background/96 backdrop-blur-xl"
          style={{ position: "fixed" }}
          {...overlayMotion(reduceMotion)}
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
                    className="block rounded-xl px-2 py-3 font-display text-3xl text-foreground transition-colors hover:text-accent motion-reduce:transition-none"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <Button href={hireCta.href} size="lg" className="w-full" onClick={onClose}>
                {hireCta.label}
              </Button>
            </div>
          </nav>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
