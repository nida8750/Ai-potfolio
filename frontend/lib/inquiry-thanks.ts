export const INQUIRY_THANKS_EVENT = "nida-inquiry-thanks";
export const INQUIRY_THANKS_KEY = "nida-inquiry-thanks";

export interface InquiryThanksState {
  firstName: string;
  replySent: boolean;
  at: number;
}

export function announceInquiryThanks(input: {
  firstName: string;
  replySent: boolean;
}): void {
  if (typeof window === "undefined") {
    return;
  }
  const payload: InquiryThanksState = {
    firstName: input.firstName,
    replySent: input.replySent,
    at: Date.now(),
  };
  sessionStorage.setItem(INQUIRY_THANKS_KEY, JSON.stringify(payload));
  window.dispatchEvent(new Event(INQUIRY_THANKS_EVENT));
}

export function readInquiryThanks(): InquiryThanksState | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = sessionStorage.getItem(INQUIRY_THANKS_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as InquiryThanksState;
    if (!parsed.firstName || typeof parsed.replySent !== "boolean") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearInquiryThanks(): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.removeItem(INQUIRY_THANKS_KEY);
  window.dispatchEvent(new Event(INQUIRY_THANKS_EVENT));
}
