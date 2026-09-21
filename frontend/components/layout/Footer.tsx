import { Container } from "@/components/ui/Container";
import {
  FOOTER_CONNECT,
  FOOTER_EXPLORE,
  FOOTER_SERVICES,
  SITE_NAME,
  SITE_YEAR,
  TAGLINE,
} from "@/lib/constants";

const groups = [
  { title: "Services", items: FOOTER_SERVICES },
  { title: "Explore", items: FOOTER_EXPLORE },
  { title: "Connect", items: FOOTER_CONNECT },
] as const;

export function Footer() {
  return (
    <footer className="relative z-[1] border-t border-white/10 bg-surface">
      <Container className="grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="min-w-0">
          <p className="font-display text-sm tracking-[0.22em] text-foreground">
            {SITE_NAME.toUpperCase()}
          </p>
          <p className="mt-3 max-w-xs text-sm leading-6 text-muted">{TAGLINE}</p>
        </div>
        {groups.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <p className="text-sm font-semibold text-foreground">{group.title}</p>
            <ul className="mt-3 space-y-2">
              {group.items.map((item) => (
                <li key={`${group.title}-${item.label}`}>
                  <a
                    href={item.href}
                    className="text-sm text-muted hover:text-foreground"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>
      <Container className="border-t border-white/10 py-5">
        <p className="text-xs text-muted">
          © {SITE_YEAR} {SITE_NAME}
        </p>
      </Container>
    </footer>
  );
}
