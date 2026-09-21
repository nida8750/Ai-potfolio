export function sanitizeText(value: string): string {
  return value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export function sanitizeMultiline(value: string): string {
  return value.replace(/<[^>]*>/g, "").trim();
}
