import {
  COUNTRY_CALLING_CODES,
  DEFAULT_COUNTRY_DIAL,
} from "@/data/country-codes";

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function composePhone(dial: string, national: string): string {
  const local = digitsOnly(national).replace(/^0+/, "");
  if (!local) {
    return "";
  }
  return `${dial}${local}`;
}

export function parsePhone(value: string | undefined): {
  dial: string;
  national: string;
} {
  const raw = (value ?? "").trim();
  if (!raw) {
    return { dial: DEFAULT_COUNTRY_DIAL, national: "" };
  }

  const compact = `+${digitsOnly(raw)}`;

  const matches = [...COUNTRY_CALLING_CODES].sort(
    (left, right) => right.dial.length - left.dial.length,
  );

  for (const country of matches) {
    if (compact.startsWith(country.dial)) {
      return {
        dial: country.dial,
        national: compact.slice(country.dial.length),
      };
    }
  }

  return { dial: DEFAULT_COUNTRY_DIAL, national: digitsOnly(raw).replace(/^0+/, "") };
}
