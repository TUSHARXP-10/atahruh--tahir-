"use client";

import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const SECONDS = 4;

/**
 * After an order is placed, open WhatsApp with the order details pre-filled so
 * the team can confirm it personally. A short countdown keeps the confirmation
 * visible and lets the customer stay; it runs once per order per session.
 */
export function WhatsAppHandoff({ url, number }: { url: string; number: string }) {
  const t = useTranslations("checkout.whatsapp");
  const key = `aar-wa-${number}`;
  const [seconds, setSeconds] = useState<number | null>(null);

  // Start the countdown unless this order was already handed off in this session.
  // The flag is written only when the countdown ends or is cancelled, so effects
  // that run twice (React dev mode) can't swallow the redirect.
  useEffect(() => {
    let done = false;
    try {
      done = sessionStorage.getItem(key) === "1";
    } catch {}
    if (done) return;
    const start = window.setTimeout(() => setSeconds(SECONDS), 0);
    return () => window.clearTimeout(start);
  }, [key]);

  useEffect(() => {
    if (seconds === null) return;
    if (seconds <= 0) {
      try {
        sessionStorage.setItem(key, "1");
      } catch {}
      window.location.href = url;
      return;
    }
    const tick = window.setTimeout(() => setSeconds((s) => (s === null ? null : s - 1)), 1000);
    return () => window.clearTimeout(tick);
  }, [seconds, key, url]);

  const stay = () => {
    try {
      sessionStorage.setItem(key, "1");
    } catch {}
    setSeconds(null);
  };

  if (seconds === null) {
    return (
      <div className="mb-8 flex justify-center">
        <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#1f6b3c] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#185731]">
          <MessageCircle className="size-4" /> {t("again")}
        </a>
      </div>
    );
  }

  return (
    <div role="status" className="mb-8 rounded-sm border border-[#2e7d50]/50 bg-[#0f2a1c] px-6 py-6 text-center sm:px-10">
      <MessageCircle className="mx-auto size-8 text-[#5fd08f]" strokeWidth={1.5} />
      <p className="mt-3 font-display text-2xl text-ivory">{t("title")}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-smoke">{t("text")}</p>
      <p className="mt-3 text-sm font-medium text-[#5fd08f]" aria-live="polite">
        {t("countdown", { seconds })}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <a
          href={url}
          onClick={() => {
            try {
              sessionStorage.setItem(key, "1");
            } catch {}
          }}
          className="inline-flex items-center gap-2 rounded-full bg-[#25a35a] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1f8c4d]"
        >
          <MessageCircle className="size-4" /> {t("openNow")}
        </a>
        <button type="button" onClick={stay} className="rounded-full border border-white/20 px-6 py-3 text-sm text-sand transition-colors hover:border-gold hover:text-gold-light">
          {t("stay")}
        </button>
      </div>
    </div>
  );
}
