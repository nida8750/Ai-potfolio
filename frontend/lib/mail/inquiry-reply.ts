import { CONTACT_EMAIL, PERSON_NAME, SITE_NAME } from "@/lib/constants";

const SERVICE_LINES = [
  "AI agents that handle real tasks",
  "Automation workflows that cut repeat work",
  "RAG knowledge systems over your documents",
  "Voice interfaces and full-stack AI products",
] as const;

export function inquiryReplySubject(): string {
  return `Thank you for reaching out — ${SITE_NAME}`;
}

export function inquiryReplyText(input: {
  name: string;
  serviceTitle?: string;
  referenceId: string;
}): string {
  const first = firstName(input.name);
  const about = input.serviceTitle
    ? ` about ${input.serviceTitle}`
    : "";
  const shortId = input.referenceId.slice(0, 8);
  return [
    `Hi ${first},`,
    "",
    `Thank you for writing to ${SITE_NAME}. I received your inquiry${about} and I appreciate you sharing what you need.`,
    "",
    "I help with:",
    ...SERVICE_LINES.map((line) => `• ${line}`),
    "",
    "I will review your message and reply from this Gmail with next steps.",
    `Your reference is ${shortId}.`,
    "",
    `Warm regards,`,
    PERSON_NAME,
    SITE_NAME,
    CONTACT_EMAIL,
  ].join("\n");
}

export function inquiryReplyHtml(input: {
  name: string;
  serviceTitle?: string;
  referenceId: string;
}): string {
  const first = firstName(input.name);
  const about = input.serviceTitle
    ? ` about <strong>${escapeHtml(input.serviceTitle)}</strong>`
    : "";
  const shortId = input.referenceId.slice(0, 8);
  const items = SERVICE_LINES.map((line) => `<li>${escapeHtml(line)}</li>`).join(
    "",
  );
  return [
    `<p>Hi ${escapeHtml(first)},</p>`,
    `<p>Thank you for writing to ${escapeHtml(SITE_NAME)}. I received your inquiry${about} and I appreciate you sharing what you need.</p>`,
    `<p>I help with:</p>`,
    `<ul>${items}</ul>`,
    `<p>I will review your message and reply from this Gmail with next steps. Your reference is <strong>${escapeHtml(shortId)}</strong>.</p>`,
    `<p>Warm regards,<br>${escapeHtml(PERSON_NAME)}<br>${escapeHtml(SITE_NAME)}<br>${escapeHtml(CONTACT_EMAIL)}</p>`,
  ].join("");
}

export function firstName(name: string): string {
  const part = name.trim().split(/\s+/)[0];
  return part || "there";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
