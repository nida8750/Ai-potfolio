import { Heart } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { accountCta, adminCta, navigation } from "@/data/navigation";
import { SITE_NAME, SITE_YEAR } from "@/lib/constants";

interface FooterProps {
  showAdmin?: boolean;
}

export function Footer({ showAdmin = true }: FooterProps) {
  return (
    <footer className="relative z-[1] border-t border-white/10 bg-surface">
      <Container className="flex flex-col gap-5 py-6 md:flex-row md:items-center md:justify-between">
        <p className="text-xs text-muted">
          © {SITE_YEAR} {SITE_NAME}. All rights reserved.
        </p>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {navigation.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="text-xs text-muted hover:text-foreground"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href={accountCta.href}
                className="text-xs text-muted hover:text-foreground"
              >
                {accountCta.label}
              </a>
            </li>
            {showAdmin ? (
              <li>
                <a
                  href={adminCta.href}
                  className="text-xs text-muted hover:text-foreground"
                >
                  {adminCta.label}
                </a>
              </li>
            ) : null}
          </ul>
        </nav>

        <p className="inline-flex items-center gap-1.5 text-xs text-muted">
          Made with
          <Heart className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span className="sr-only">love</span>
          &amp; AI
        </p>
      </Container>
    </footer>
  );
}
