import type { NavItem } from "@/types/navigation";

export const navigation: NavItem[] = [
  { label: "Home", href: "#home" },
  { label: "Services", href: "#services" },
  { label: "Automation", href: "#automation" },
  { label: "Agents", href: "#agents" },
  { label: "Projects", href: "#projects" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export const hireCta: NavItem = {
  label: "Hire Me",
  href: "#contact",
};

export const accountCta: NavItem = {
  label: "Sign in",
  href: "/login",
};

export const adminCta: NavItem = {
  label: "Admin",
  href: "/admin-login",
};
