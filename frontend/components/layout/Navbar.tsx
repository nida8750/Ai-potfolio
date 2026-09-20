"use client";

import { useId, useState } from "react";
import { Menu } from "lucide-react";
import { navigation } from "@/data/navigation";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { SITE_NAME } from "@/lib/constants";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const menuId = useId();

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-canvas/70 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between md:h-[72px]">
        <a
          href="#home"
          className="font-display text-sm tracking-[0.22em] text-ink"
          aria-label={`${SITE_NAME} home`}
        >
          {SITE_NAME.toUpperCase()}
        </a>
        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {navigation.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="text-sm text-muted transition-colors hover:text-ink"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <Button href="#contact" size="sm" className="hidden xs:inline-flex">
            Hire Me
          </Button>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-ink lg:hidden"
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </Container>
      <MobileMenu open={open} onClose={() => setOpen(false)} menuId={menuId} />
    </header>
  );
}
