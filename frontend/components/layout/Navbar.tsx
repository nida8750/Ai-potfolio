"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { hireCta, navigation } from "@/data/navigation";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeHref, setActiveHref] = useState("#home");
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    function onScroll() {
      const next = window.scrollY > 12;
      setScrolled((prev) => (prev === next ? prev : next));

      const offset = 120;
      let current = navigation[0]?.href ?? "#home";
      for (const item of navigation) {
        const section = document.getElementById(item.href.slice(1));
        if (section && section.getBoundingClientRect().top <= offset) {
          current = item.href;
        }
      }
      setActiveHref((prev) => (prev === current ? prev : current));
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (wasOpen.current && !open) {
      triggerRef.current?.focus();
    }
    wasOpen.current = open;
  }, [open]);

  return (
    <header
      data-site-header
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-xl motion-reduce:transition-none",
        scrolled
          ? "border-white/20 bg-background/95 shadow-[0_10px_30px_rgb(0_0_0_/_0.45)]"
          : "border-transparent bg-transparent",
      )}
    >
      <Container className="grid h-16 grid-cols-[auto_1fr_auto] items-center gap-3 md:h-[4.5rem]">
        <a
          href="#home"
          className="min-w-0 justify-self-start font-display text-sm tracking-[0.18em] text-foreground wide:tracking-[0.22em]"
          aria-label={`${SITE_NAME} home`}
        >
          {SITE_NAME.toUpperCase()}
        </a>
        <nav aria-label="Primary" className="hidden justify-self-center lg:block">
          <ul className="flex items-center gap-6 xl:gap-8">
            {navigation.map((item) => {
              const isActive = activeHref === item.href;
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    aria-current={isActive ? "location" : undefined}
                    className={cn(
                      "text-sm motion-reduce:transition-none",
                      isActive
                        ? "text-foreground underline decoration-primary decoration-2 underline-offset-8"
                        : "text-muted hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="flex items-center justify-self-end gap-2">
          <span className="hidden lg:inline-flex">
            <Button href={hireCta.href} size="sm">
              {hireCta.label}
            </Button>
          </span>
          <button
            ref={triggerRef}
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-foreground lg:hidden"
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((current) => !current)}
          >
            {open ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </Container>
      <MobileMenu open={open} onClose={() => setOpen(false)} menuId={menuId} />
    </header>
  );
}
