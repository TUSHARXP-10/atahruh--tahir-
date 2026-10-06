"use client";

import { Check, Link2, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ProductCard } from "@/components/product/product-card";
import { useQuickView } from "@/components/product/quick-view";
import type { FormType, ProductCardData } from "@/lib/types";

export type TopMatch = { card: ProductCardData; score: number; reasons: string[] };

/** The three best matches: score ring, the product card, and why it matched. */
export function TopMatches({ matches, preferForm }: { matches: TopMatch[]; preferForm?: FormType }) {
  const t = useTranslations("quiz.result");
  const quickView = useQuickView();
  return (
    <ol className="grid gap-6 md:grid-cols-3">
      {matches.map((m, i) => (
        <li key={m.card.id} className="flex flex-col">
          <div className="mb-3 flex items-center gap-3">
            <ScoreRing score={m.score} />
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.16em] text-gold">#{i + 1}</p>
              <p className="text-sm text-ivory">{t("match", { score: m.score })}</p>
            </div>
          </div>
          <ProductCard product={m.card} onQuickView={quickView.open} preferForm={preferForm} priority={i === 0} />
          {m.reasons.length ? (
            <ul className="mt-3 space-y-1.5">
              {m.reasons.map((r) => (
                <li key={r} className="flex items-start gap-2 text-sm text-smoke">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-gold" strokeWidth={2.5} /> {r}
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 48 48" className="size-12 -rotate-90" aria-hidden>
      <circle cx="24" cy="24" r={r} fill="none" stroke="rgb(255 255 255 / 0.1)" strokeWidth="3" />
      <circle cx="24" cy="24" r={r} fill="none" stroke="#c9a55c" strokeWidth="3" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} />
      <text x="24" y="24" dy="0.35em" textAnchor="middle" transform="rotate(90 24 24)" fill="#e8cd92" fontSize="12" fontWeight="600">
        {score}
      </text>
    </svg>
  );
}

export function ShareResult({ url, title }: { url: string; title: string }) {
  const t = useTranslations("quiz.result");
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs text-sand transition-colors hover:border-gold hover:text-gold-light"
      >
        <MessageCircle className="size-3.5" /> WhatsApp
      </a>
      <button
        type="button"
        onClick={async () => {
          try {
            if (navigator.share) await navigator.share({ title, url });
            else {
              await navigator.clipboard.writeText(url);
              toast.success(t("copied"));
            }
          } catch {}
        }}
        className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs text-sand transition-colors hover:border-gold hover:text-gold-light"
      >
        <Link2 className="size-3.5" /> {t("share")}
      </button>
    </div>
  );
}
