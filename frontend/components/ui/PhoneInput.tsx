"use client";

import { useMemo, useState } from "react";
import { COUNTRY_CALLING_CODES } from "@/data/country-codes";
import { composePhone, parsePhone } from "@/lib/phone";
import { SelectInput, TextInput } from "@/components/ui/Field";

interface PhoneInputProps {
  id: string;
  name?: string;
  defaultValue?: string;
  autoComplete?: string;
  required?: boolean;
}

function isoForDial(dial: string): string {
  return COUNTRY_CALLING_CODES.find((country) => country.dial === dial)?.iso ?? "PK";
}

function dialForIso(iso: string): string {
  return COUNTRY_CALLING_CODES.find((country) => country.iso === iso)?.dial ?? "+92";
}

export function PhoneInput({
  id,
  name = "phone",
  defaultValue = "",
  autoComplete = "tel-national",
  required,
}: PhoneInputProps) {
  const initial = useMemo(() => parsePhone(defaultValue), [defaultValue]);
  const [iso, setIso] = useState(isoForDial(initial.dial));
  const [national, setNational] = useState(initial.national);
  const composed = composePhone(dialForIso(iso), national);
  const countryId = `${id}-country`;

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[10.5rem_minmax(0,1fr)]">
      <SelectInput
        id={countryId}
        value={iso}
        aria-label="Country calling code"
        title={COUNTRY_CALLING_CODES.find((country) => country.iso === iso)?.name}
        onChange={(event) => setIso(event.target.value)}
      >
        {COUNTRY_CALLING_CODES.map((country) => (
          <option key={country.iso} value={country.iso}>
            {country.iso} {country.dial}
          </option>
        ))}
      </SelectInput>
      <TextInput
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete={autoComplete}
        required={required}
        value={national}
        placeholder="300 1234567"
        aria-label="Phone number"
        onChange={(event) => setNational(event.target.value)}
      />
      <input type="hidden" name={name} value={composed} />
    </div>
  );
}
