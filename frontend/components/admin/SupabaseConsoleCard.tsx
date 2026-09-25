import { GlassCard } from "@/components/ui/GlassCard";
import {
  SUPABASE_CONSOLE_LINKS,
  supabaseDashboardUrl,
  supabaseProjectRef,
} from "@/lib/supabase/console";

export function SupabaseConsoleCard() {
  const home = supabaseDashboardUrl();

  return (
    <div id="supabase" className="scroll-mt-24">
      <GlassCard className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg text-foreground">Supabase</h2>
            <p className="mt-1 text-sm text-muted">
              Project <span className="text-foreground">{supabaseProjectRef()}</span>.
              Open the live dashboard to manage Auth, users, tables, SQL, and logs.
            </p>
          </div>
          <a
            href={home}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-full border border-white/15 px-4 py-2 text-sm text-foreground hover:border-primary/50 hover:text-primary"
          >
            Open Supabase
          </a>
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {SUPABASE_CONSOLE_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="block rounded-xl border border-white/10 px-3 py-2 text-sm text-muted hover:border-white/25 hover:text-foreground"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
