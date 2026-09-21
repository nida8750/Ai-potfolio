import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// A control sits on top of a dark card, so it needs a lighter surface than
// the card and a visible border. Using the page background here made fields
// read as empty space.
const controlClasses =
  "w-full rounded-xl border border-white/20 bg-surface-secondary px-3 py-2.5 text-base text-foreground shadow-[inset_0_1px_0_rgb(255_255_255_/_0.04)] outline-none transition-colors placeholder:text-muted/70 hover:border-white/30 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60 md:text-sm";

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function Field({ id, label, hint, error, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-300">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClasses, className)} {...props} />;
}

export function TextArea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlClasses, "resize-y", className)} {...props} />;
}

export function SelectInput({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlClasses, className)} {...props}>
      {children}
    </select>
  );
}

export function Checkbox({
  id,
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string }) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm text-foreground">
      <input
        id={id}
        type="checkbox"
        className="h-4 w-4 rounded border-white/30 bg-surface-secondary accent-primary"
        {...props}
      />
      {label}
    </label>
  );
}
