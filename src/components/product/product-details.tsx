import { CalendarDays, Moon, Sun } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { ReviewForm } from "./review-form";
import { KhatamStar, Ornament } from "@/components/brand/ornament";
import { GirihPattern } from "@/components/brand/patterns";
import { Reveal } from "@/components/motion/reveal";
import { Stars } from "@/components/ui/stars";
import { cn } from "@/lib/utils";
import type { ProductDetail } from "@/server/queries/catalog";
import { FormAwareText } from "./form-context";

/** Top / heart / base notes as a stepped pyramid. */
export async function NotesPyramid({ product }: { product: ProductDetail }) {
  const t = await getTranslations("product");
  const tiers = [
    { key: "top", label: t("top"), notes: product.notesPyramid.top, width: "max-w-md" },
    { key: "heart", label: t("heart"), notes: product.notesPyramid.heart, width: "max-w-2xl" },
    { key: "base", label: t("base"), notes: product.notesPyramid.base, width: "max-w-4xl" },
  ].filter((tier) => tier.notes.length);
  if (!tiers.length) return null;

  return (
    <section className="relative overflow-hidden border-y border-gold/10 bg-ebony/60 py-20">
      <GirihPattern opacity={0.04} />
      <div className="relative mx-auto max-w-5xl px-4 text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <Ornament className="w-8" />
          <span className="eyebrow">{product.name}</span>
          <Ornament className="w-8 -scale-x-100" />
        </div>
        <h2 className="text-display-md text-ivory">{t("notes")}</h2>
        <div className="mt-14 space-y-4">
          {tiers.map((tier, i) => (
            <Reveal key={tier.key} delay={i * 0.15} className={cn("mx-auto", tier.width)}>
              <div className="border-gold-gradient relative rounded-sm px-6 py-6">
                <p className="mb-3 text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-gold">{tier.label}</p>
                <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                  {tier.notes.map((n, j) => (
                    <li key={n.slug} className="flex items-center gap-5 font-display text-2xl text-ivory sm:text-3xl">
                      {j > 0 ? <KhatamStar className="size-2.5 text-gold/50" /> : null}
                      {n.name}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between text-sm">
        <span className="text-smoke">{label}</span>
        <span className="font-display text-lg text-gold-light">{value}/5</span>
      </div>
      <div className="flex gap-1.5" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={cn("h-1.5 flex-1 rounded-full", i <= value ? "bg-gold-metal" : "bg-umber")} />
        ))}
      </div>
    </div>
  );
}

export async function ScentProfile({ product }: { product: ProductDetail }) {
  const t = await getTranslations();
  return (
    <section className="py-20">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-10">
        <Reveal>
          <div className="mb-4 flex items-center gap-3">
            <Ornament className="w-8" />
            <span className="eyebrow">{t("product.profile")}</span>
          </div>
          <div className="space-y-6">
            <Meter label={t("product.longevity")} value={product.longevity} />
            <Meter label={t("product.sillage")} value={product.sillage} />
            <Meter label={t("product.intensity")} value={product.intensity} />
          </div>
          <dl className="mt-10 grid gap-6 sm:grid-cols-3">
            {product.seasons.length ? (
              <div>
                <dt className="mb-2 flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.2em] text-mist">
                  <CalendarDays className="size-3.5 text-gold" /> {t("product.season")}
                </dt>
                <dd className="text-sm text-ivory">{product.seasons.map((s) => t(`seasons.${s}`)).join(" · ")}</dd>
              </div>
            ) : null}
            {product.times.length ? (
              <div>
                <dt className="mb-2 flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.2em] text-mist">
                  {product.times.includes("NIGHT") ? <Moon className="size-3.5 text-gold" /> : <Sun className="size-3.5 text-gold" />} {t("product.time")}
                </dt>
                <dd className="text-sm text-ivory">{product.times.map((s) => t(`times.${s}`)).join(" · ")}</dd>
              </div>
            ) : null}
            {product.occasions.length ? (
              <div>
                <dt className="mb-2 text-[0.62rem] uppercase tracking-[0.2em] text-mist">{t("product.occasion")}</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {product.occasions.map((o) => (
                    <span key={o} className="rounded-full border border-gold/25 px-2.5 py-0.5 text-xs text-smoke">
                      {t(`occasions.${o}`)}
                    </span>
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>
          {product.moods.length ? (
            <div className="mt-8 flex flex-wrap gap-2">
              {product.moods.map((m) => (
                <span key={m} className="rounded-full bg-gold/10 px-3 py-1 text-xs text-gold-light">
                  {t(`moods.${m}`)}
                </span>
              ))}
            </div>
          ) : null}
        </Reveal>

        <Reveal delay={0.1} className="space-y-10">
          {product.formDetails.some((f) => f.howToUse) ? (
            <div>
              <div className="mb-4 flex items-center gap-3">
                <Ornament className="w-8" />
                <span className="eyebrow">{t("product.howToUse")}</span>
              </div>
              <FormAwareText
                texts={Object.fromEntries(product.formDetails.map((f) => [f.type, f.howToUse]))}
                className="font-display text-2xl leading-snug text-ivory"
              />
            </div>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}

type Review = { id: string; authorName: string; location: string | null; rating: number; title: string | null; body: string; verified: boolean; createdAt: Date };

export async function Reviews({
  productId,
  defaultName,
  reviews,
  distribution,
  rating,
}: {
  productId: string;
  defaultName?: string;
  reviews: Review[];
  distribution: { star: number; count: number }[];
  rating: { avg: number; count: number };
}) {
  const [t, format] = await Promise.all([getTranslations(), getFormatter()]);
  const max = Math.max(1, ...distribution.map((d) => d.count));
  return (
    <section id="reviews" className="scroll-mt-24 border-t border-gold/10 py-20">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-4 sm:px-6 grid-cols-1 lg:grid-cols-12 lg:px-10">
        <div className="lg:col-span-4">
          <div className="mb-4 flex items-center gap-3">
            <Ornament className="w-8" />
            <span className="eyebrow">{t("product.reviews")}</span>
          </div>
          {rating.count ? (
            <>
              <p className="font-display text-7xl text-gold-light">{rating.avg.toFixed(1)}</p>
              <Stars value={rating.avg} size={18} className="mt-2" />
              <p className="mt-2 text-sm text-mist">{t("product.basedOn", { count: rating.count })}</p>
              <ul className="mt-8 space-y-2">
                {distribution.map((d) => (
                  <li key={d.star} className="flex items-center gap-3 text-xs text-mist">
                    <span className="w-3 tabular-nums">{d.star}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-umber">
                      <span className="block h-full rounded-full bg-gold-metal" style={{ width: `${(d.count / max) * 100}%` }} />
                    </span>
                    <span className="w-6 text-end tabular-nums">{d.count}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-smoke">{t("product.noReviews")}</p>
          )}
          <ReviewForm productId={productId} defaultName={defaultName} />
        </div>
        <ul className="divide-y divide-gold/10 lg:col-span-8">
          {reviews.map((r) => (
            <li key={r.id} className="py-7 first:pt-0">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Stars value={r.rating} size={13} />
                <time className="text-xs text-mist" dateTime={new Date(r.createdAt).toISOString()}>
                  {format.dateTime(new Date(r.createdAt), { day: "numeric", month: "short", year: "numeric" })}
                </time>
              </div>
              {r.title ? <p className="mt-3 font-display text-2xl text-ivory">{r.title}</p> : null}
              <p className="mt-2 leading-relaxed text-smoke">{r.body}</p>
              <p className="mt-3 text-xs text-mist">
                <span className="font-semibold text-ivory/90">{r.authorName}</span>
                {r.location ? ` · ${r.location}` : ""}
                {r.verified ? <span className="ms-2 text-gold/80">✓ {t("common.verifiedBuyer")}</span> : null}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
