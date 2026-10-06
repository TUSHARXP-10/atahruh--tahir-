"use client";

import { ArrowUp, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useStore } from "@/components/providers/store-provider";

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.4 5 5.2-1.36A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.08.8.82-3-.2-.31a8.2 8.2 0 1 1 6.94 3.84Zm4.5-6.14c-.25-.12-1.46-.72-1.69-.8-.22-.09-.39-.13-.55.12-.16.25-.63.8-.78.96-.14.17-.29.19-.53.06a6.7 6.7 0 0 1-3.34-2.92c-.25-.43.25-.4.72-1.34.08-.16.04-.3-.02-.43-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.41-.55-.42h-.47a.9.9 0 0 0-.65.3 2.74 2.74 0 0 0-.86 2.04 4.77 4.77 0 0 0 1 2.53c.12.16 1.73 2.64 4.18 3.7 1.56.67 2.17.73 2.95.62.47-.07 1.46-.6 1.66-1.18.2-.58.2-1.07.15-1.18-.07-.1-.23-.16-.47-.28Z" />
    </svg>
  );
}

export function FloatingActions({ whatsapp, conciergeEnabled }: { whatsapp: string; conciergeEnabled: boolean }) {
  const t = useTranslations();
  const { setConciergeOpen } = useStore();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 1400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    // Lifts above the product page's sticky Add to cart bar while it shows (phones/tablets)
    <div className="fixed bottom-5 end-4 z-40 flex flex-col items-end gap-3 transition-[bottom] duration-300 sm:bottom-7 sm:end-6 max-lg:[.has-sticky-bar_&]:bottom-24">
      <AnimatePresence>
        {showTop ? (
          <motion.button
            key="top"
            type="button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="grid size-11 place-items-center rounded-full border border-gold/30 bg-noir/80 text-gold-light backdrop-blur transition-colors hover:border-gold"
            aria-label={t("common.backToTop")}
          >
            <ArrowUp className="size-4" strokeWidth={1.25} />
          </motion.button>
        ) : null}
      </AnimatePresence>

      {conciergeEnabled ? (
        <button
          type="button"
          onClick={() => setConciergeOpen(true)}
          className="group flex h-12 items-center gap-2 rounded-full border border-gold/40 bg-noir/85 ps-3 pe-4 text-gold-light shadow-[0_10px_40px_-10px_rgba(201,165,92,0.5)] backdrop-blur transition-colors hover:border-gold"
          aria-label={t("nav.concierge")}
        >
          <span className="grid size-7 place-items-center rounded-full bg-gold-metal text-ink">
            <Sparkles className="size-3.5" strokeWidth={1.5} />
          </span>
          <span className="hidden text-[0.66rem] font-semibold uppercase tracking-[0.18em] sm:inline">{t("nav.concierge")}</span>
        </button>
      ) : null}

      <a
        href={`https://wa.me/${whatsapp}`}
        target="_blank"
        rel="noreferrer"
        className="grid size-12 place-items-center rounded-full bg-[#1f7a4d] text-white shadow-[0_10px_30px_-8px_rgba(31,122,77,0.7)] transition-transform hover:scale-105"
        aria-label="WhatsApp"
      >
        <WhatsAppGlyph className="size-6" />
      </a>
    </div>
  );
}
