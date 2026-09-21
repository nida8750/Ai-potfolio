export interface SocialLink {
  label: string;
  icon: "linkedin" | "github" | "x" | "email" | "whatsapp";
  href: string;
}

/**
 * Only entries with a real destination are rendered. Add the profile URLs as
 * they become available — an empty `href` is skipped rather than shown as a
 * dead icon, so nothing here points somewhere that does not exist.
 */
export const socialLinks: SocialLink[] = [
  { label: "LinkedIn", icon: "linkedin", href: "" },
  { label: "GitHub", icon: "github", href: "" },
  { label: "X", icon: "x", href: "" },
];

export function activeSocialLinks(): SocialLink[] {
  return socialLinks.filter((link) => link.href.trim().length > 0);
}
