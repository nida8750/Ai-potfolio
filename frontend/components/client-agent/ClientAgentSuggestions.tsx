"use client";

interface ClientAgentSuggestionsProps {
  items: readonly string[];
  onSelect: (text: string) => void;
}

export function ClientAgentSuggestions({
  items,
  onSelect,
}: ClientAgentSuggestionsProps) {
  return (
    <div className="flex flex-wrap gap-2" role="list" aria-label="Suggested questions">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          role="listitem"
          onClick={() => onSelect(item)}
          className="rounded-full border border-white/10 px-2.5 py-1.5 text-left text-[11px] text-muted hover:border-accent/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          {item}
        </button>
      ))}
    </div>
  );
}
