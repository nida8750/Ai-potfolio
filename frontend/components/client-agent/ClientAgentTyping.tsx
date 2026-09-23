"use client";

export function ClientAgentTyping() {
  return (
    <div
      className="flex max-w-[72%] items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2"
      role="status"
      aria-live="polite"
      aria-label="Assistant is typing"
    >
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full bg-accent/80 motion-safe:animate-bounce"
          style={{ animationDelay: `${dot * 120}ms` }}
        />
      ))}
    </div>
  );
}
