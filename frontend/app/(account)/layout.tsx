import Link from "next/link";
import { BackButton } from "@/components/app/BackButton";
import { SITE_NAME, TAGLINE } from "@/lib/constants";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main id="main" className="relative flex min-h-dvh flex-col">
      <header className="border-b border-white/10">
        <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between px-4 py-4 md:px-8">
          <Link
            href="/"
            className="font-display text-sm tracking-[0.22em] text-foreground"
          >
            {SITE_NAME.toUpperCase()}
          </Link>
          <BackButton fallback="/" label="Back to site" />
        </div>
      </header>
      <div className="flex flex-1 items-center justify-center px-4 py-10 md:py-16">
        <div className="w-full max-w-md">
          {children}
          <p className="mt-6 text-center text-xs text-muted">{TAGLINE}</p>
        </div>
      </div>
    </main>
  );
}
