import type { ReactNode } from "react";

interface DataTableProps {
  caption: string;
  headers: string[];
  children: ReactNode;
}

/**
 * Horizontally scrollable table wrapper so wide admin tables stay usable on
 * narrow screens instead of forcing the page to overflow.
 */
export function DataTable({ caption, headers, children }: DataTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-surface/60">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-white/10">
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06]">{children}</tbody>
      </table>
    </div>
  );
}
