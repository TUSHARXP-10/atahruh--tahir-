"use client";

import { CheckCircle2, Loader2, PenLine, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { submitReview } from "@/server/actions/reviews";

const field = "w-full rounded-sm border border-gold/25 bg-ebony/70 px-4 text-sm text-ivory placeholder:text-mist focus:border-gold/70 focus:outline-none";

export function ReviewForm({ productId, defaultName }: { productId: string; defaultName?: string }) {
  const t = useTranslations("product");
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();

  if (sent) {
    return (
      <p role="status" className="mt-8 flex items-start gap-3 rounded-sm border border-gold/25 bg-gold/5 p-4 text-sm text-ivory">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-gold" /> {t("review.thanks")}
      </p>
    );
  }
  if (!open) {
    return (
      <Button variant="outline" className="mt-8" onClick={() => setOpen(true)}>
        <PenLine /> {t("writeReview")}
      </Button>
    );
  }

  return (
    <form
      className="mt-8 space-y-4 rounded-sm border border-gold/15 bg-ebony/60 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const get = (k: string) => String(f.get(k) ?? "");
        if (!rating || get("body").trim().length < 15) return setError(t("review.error"));
        start(async () => {
          const res = await submitReview({ productId, rating, title: get("title"), body: get("body"), authorName: get("authorName"), location: get("location"), website: get("website") });
          if (res.ok) setSent(true);
          else setError(res.error === "RATE_LIMIT" ? t("review.rateLimit") : t("review.error"));
        });
      }}
    >
      <p className="font-display text-2xl text-ivory">{t("review.title")}</p>
      <fieldset>
        <legend className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-smoke">{t("review.rating")}</legend>
        <div className="flex gap-1" role="radiogroup" aria-label={t("review.rating")} onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={t("review.stars", { n })}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              className="p-0.5"
            >
              <Star className={cn("size-7 transition-colors", n <= (hover || rating) ? "fill-gold text-gold" : "text-gold/30")} strokeWidth={1.25} />
            </button>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-smoke">{t("review.name")}</span>
          <input name="authorName" required minLength={2} maxLength={60} defaultValue={defaultName} className={cn(field, "h-11")} />
        </label>
        <label className="block">
          <span className="mb-2 block text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-smoke">{t("review.city")}</span>
          <input name="location" maxLength={60} className={cn(field, "h-11")} />
        </label>
      </div>
      <label className="block">
        <span className="mb-2 block text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-smoke">{t("review.headline")}</span>
        <input name="title" maxLength={80} className={cn(field, "h-11")} />
      </label>
      <label className="block">
        <span className="mb-2 block text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-smoke">{t("review.body")}</span>
        <textarea name="body" required minLength={15} maxLength={2000} rows={4} placeholder={t("review.bodyHint")} className={cn(field, "py-3 leading-relaxed")} />
      </label>
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {error ? (
        <p role="alert" className="text-sm text-[#f0a3ad]">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        {pending ? t("review.submitting") : t("review.submit")}
      </Button>
    </form>
  );
}
