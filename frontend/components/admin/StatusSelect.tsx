"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { SelectInput } from "@/components/ui/Field";
import { apiRequest, errorMessage } from "@/lib/api/client";

interface StatusSelectProps {
  endpoint: string;
  field: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  label: string;
}

/**
 * Inline status control used by the inquiry and order tables. Invalid
 * transitions are rejected by the server and surfaced here.
 */
export function StatusSelect({
  endpoint,
  field,
  value,
  options,
  label,
}: StatusSelectProps) {
  const router = useRouter();
  const [current, setCurrent] = useState(value);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change(next: string) {
    const previous = current;
    setCurrent(next);
    setPending(true);
    setError(null);

    try {
      await apiRequest(endpoint, { method: "PATCH", json: { [field]: next } });
      router.refresh();
    } catch (caught) {
      setCurrent(previous);
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-w-[150px]">
      <SelectInput
        aria-label={label}
        value={current}
        disabled={pending}
        onChange={(event) => change(event.target.value)}
        className="py-1.5 text-xs"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectInput>
      {error ? (
        <Alert tone="error" className="mt-2 text-xs">
          {error}
        </Alert>
      ) : null}
    </div>
  );
}
