import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { getCurrentUser } from "@/lib/auth/server";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const showAdmin = user?.role !== "USER";

  return (
    <div className="overflow-x-hidden pb-20">
      <Navbar showAdmin={showAdmin} />
      {children}
      <Footer showAdmin={showAdmin} />
    </div>
  );
}
