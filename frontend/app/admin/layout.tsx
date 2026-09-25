import type { Metadata } from "next";
import { AppShell } from "@/components/app/AppShell";
import { requireAdminOrRedirect } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Admin console | Nida AI",
  robots: { index: false, follow: false },
};

const navItems = [
  { label: "Overview", href: "/admin" },
  { label: "Supabase", href: "/admin#supabase" },
  { label: "AI control", href: "/admin/ai" },
  { label: "Services", href: "/admin/services" },
  { label: "Projects", href: "/admin/projects" },
  { label: "Inquiries", href: "/admin/inquiries" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Payments", href: "/admin/payments" },
  { label: "Users", href: "/admin/users" },
  { label: "Activity", href: "/admin/activity" },
  { label: "Settings", href: "/admin/settings" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Role is re-checked on the server for every admin render.
  const admin = await requireAdminOrRedirect("/admin");

  return (
    <AppShell
      kind="admin"
      userName={admin.name}
      userRole="Administrator"
      navItems={navItems}
    >
      {children}
    </AppShell>
  );
}
