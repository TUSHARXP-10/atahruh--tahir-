"use client";

import { Link2, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export function ShareArticle({ url, title }: { url: string; title: string }) {
  const t = useTranslations("journalPage");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-fg-muted">{t("share")}</span>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full border border-hairline px-3 py-1.5 text-xs text-heading transition-colors hover:border-accent"
        aria-label={t("shareWhatsapp")}
      >
        <MessageCircle className="size-3.5" /> WhatsApp
      </a>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            toast.success(t("copied"));
          } catch {}
        }}
        className="inline-flex items-center gap-1.5 rounded-full border border-hairline px-3 py-1.5 text-xs text-heading transition-colors hover:border-accent"
      >
        <Link2 className="size-3.5" /> {t("copyLink")}
      </button>
    </div>
  );
}
