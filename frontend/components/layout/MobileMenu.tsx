"use client";

import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { navigation } from "@/data/navigation";
import { Button } from "@/components/ui/Button";
import { SITE_NAME } from "@/lib/constants";
import { fadeIn, motionSafe } from "@/lib/animations";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  menuId: string;
}

export function MobileMenu({ open, onClose, menuId }: MobileMenuProps) {
  const reduceMotion = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

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
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const root = document.getElementById(menuId);
      if (!root) {
        return;
      }

      const focusable = root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuId, onClose, open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          id={menuId}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed inset-0 z-50 flex flex-col bg-canvas/96 backdrop-blur-xl lg:hidden"
          {...motionSafe(reduceMotion)}
          variants={fadeIn}
        >
          <div className="flex items-center justify-between px-4 py-4 xs:px-5">
            <p id={titleId} className="font-display text-sm tracking-[0.2em] text-ink">
              {SITE_NAME}
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-ink"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Mobile" className="flex flex-1 flex-col justify-center px-6">
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={onClose}
                    className="block rounded-xl px-3 py-3 font-display text-3xl text-ink transition-colors hover:text-blue"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <Button href="#contact" size="lg" className="w-full" onClick={onClose}>
                Hire Me
              </Button>
            </div>
          </nav>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
