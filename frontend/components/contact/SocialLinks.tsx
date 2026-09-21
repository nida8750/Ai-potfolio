import { AtSign, MessageCircle } from "lucide-react";
import { activeSocialLinks } from "@/data/social";
import type { SocialLink } from "@/data/social";

/**
 * Lucide 1.x ships no brand marks, so the three brand glyphs are inlined.
 * Everything else reuses the icon set.
 */
function LinkedInMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.71h.05c.53-.95 1.83-1.96 3.77-1.96 4.03 0 4.78 2.5 4.78 5.76V21h-4v-5.6c0-1.34-.03-3.07-1.95-3.07-1.96 0-2.26 1.46-2.26 2.97V21h-4V9Z" />
    </svg>
  );
}

function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03a9.5 9.5 0 0 1 5 0c1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  );
}

function XMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M17.53 3H20l-5.4 6.17L21 21h-5.06l-3.96-5.2L7.44 21H4.97l5.78-6.6L3.5 3h5.19l3.58 4.74L17.53 3Zm-.87 16.5h1.37L8.4 4.42H6.93l9.73 15.08Z" />
    </svg>
  );
}

function iconFor(link: SocialLink) {
  switch (link.icon) {
    case "linkedin":
      return <LinkedInMark />;
    case "github":
      return <GitHubMark />;
    case "x":
      return <XMark />;
    case "email":
      return <AtSign className="h-4 w-4" aria-hidden="true" />;
    default:
      return <MessageCircle className="h-4 w-4" aria-hidden="true" />;
  }
}

/** Renders nothing until at least one real profile URL is configured. */
export function SocialLinks() {
  const links = activeSocialLinks();

  if (links.length === 0) {
    return null;
  }

  return (
    <ul className="mt-6 flex flex-wrap gap-2.5">
      {links.map((link) => (
        <li key={link.label}>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/12 bg-surface/70 text-muted transition-colors hover:border-primary/45 hover:text-foreground motion-reduce:transition-none"
          >
            {iconFor(link)}
          </a>
        </li>
      ))}
    </ul>
  );
}
