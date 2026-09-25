"use client";

import { useEffect, useState } from "react";
import {
  INQUIRY_THANKS_EVENT,
  clearInquiryThanks,
  readInquiryThanks,
  type InquiryThanksState,
} from "@/lib/inquiry-thanks";

export function InquiryThanksBanner() {
  const [thanks, setThanks] = useState<InquiryThanksState | null>(null);

  useEffect(() => {
    function sync() {
      setThanks(readInquiryThanks());
    }
    sync();
    window.addEventListener(INQUIRY_THANKS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(INQUIRY_THANKS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (!thanks) {
    return null;
  }

  return (
    <div className="relative z-20 border-b border-emerald-400/25 bg-emerald-400/10">
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-3 px-4 py-2.5 sm:px-6">
        <p className="text-sm leading-6 text-emerald-100" role="status">
          Thank you, {thanks.firstName}. Your inquiry is with me
          {thanks.replySent
            ? " — a short reply is on its way to your email."
            : ". I’ll follow up by email."}
        </p>
        <button
          type="button"
          onClick={clearInquiryThanks}
          className="shrink-0 text-xs text-emerald-200/80 hover:text-emerald-50"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
