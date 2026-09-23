import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-hidden">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}
