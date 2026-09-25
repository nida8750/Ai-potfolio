import type { Metadata } from "next";
import { AppShell } from "@/components/app/AppShell";
import { requireAdminOrRedirect } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Dashboard | Nida AI",
  robots: { index: false, follow: false },
};

const navItems = [
  { label: "Overview", href: "/dashboard" },
  { label: "Supabase", href: "/dashboard/platform" },
  { label: "AI platform", href: "/dashboard/ai" },
  { label: "Orders", href: "/dashboard/orders" },
  { label: "Inquiries", href: "/dashboard/inquiries" },
  { label: "Notifications", href: "/dashboard/notifications" },
  { label: "Profile", href: "/dashboard/profile" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side gate: the proxy redirect is a convenience, this is the check
  // that actually protects the page.
  const user = await requireAdminOrRedirect("/dashboard");

  return (
    <AppShell
      kind="dashboard"
      userName={user.name}
      userRole="Administrator"
      navItems={[...navItems, { label: "Admin console", href: "/admin" }]}
    >
      {children}
    </AppShell>
  );
}
