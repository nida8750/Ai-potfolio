import { navigation } from "@/data/navigation";
import { Container } from "@/components/ui/Container";
import {
  FOOTER_EXPLORE,
  FOOTER_SERVICES,
  SITE_NAME,
  SOCIAL_LINKS,
  TAGLINE,
} from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-white/8 bg-surface">
      <Container className="grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div id="about">
          <p className="font-display text-sm tracking-[0.22em] text-ink">
            {SITE_NAME.toUpperCase()}
          </p>
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted">{TAGLINE}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Services</p>
          <ul className="mt-4 space-y-2">
            {FOOTER_SERVICES.map((item) => (
              <li key={item.label}>
                <a href={item.href} className="text-sm text-muted hover:text-ink">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Explore</p>
          <ul className="mt-4 space-y-2">
            {FOOTER_EXPLORE.map((item) => (
              <li key={item.label}>
                <a href={item.href} className="text-sm text-muted hover:text-ink">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div id="contact">
          <p className="text-sm font-semibold text-ink">Connect</p>
          <ul className="mt-4 space-y-2">
            <li>
              <a href={SOCIAL_LINKS.github} className="text-sm text-muted hover:text-ink">
                GitHub
              </a>
            </li>
            <li>
              <a href={SOCIAL_LINKS.linkedin} className="text-sm text-muted hover:text-ink">
                LinkedIn
              </a>
            </li>
            <li>
              <a href={SOCIAL_LINKS.email} className="text-sm text-muted hover:text-ink">
                Email
              </a>
            </li>
          </ul>
        </div>
      </Container>
      <Container className="flex flex-col gap-3 border-t border-white/8 py-6 text-xs text-muted md:flex-row md:items-center md:justify-between">
        <p>© 2026 {SITE_NAME}</p>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-4">
            {navigation.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="hover:text-ink">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </footer>
  );
}
