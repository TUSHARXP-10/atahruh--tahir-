"use client";

import { BadgeCheck, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCarousel } from "@/components/product/product-carousel";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Stars } from "@/components/ui/stars";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Testimonial = {
  id: string;
  name: string;
  location: string | null;
  rating: number;
  quote: string;
  product: { slug: string; name: string } | null;
};

export function Testimonials({ items }: { items: Testimonial[] }) {
  const t = useTranslations();
  const { ref, api, canPrev, canNext } = useCarousel();
  if (!items.length) return null;
  const arrow =
    "absolute top-1/2 z-10 hidden size-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-noir/80 text-ivory backdrop-blur transition-colors hover:border-gold hover:text-gold-light disabled:pointer-events-none disabled:opacity-0 md:grid";

  return (
    <Section tone="dark" className="py-16 lg:py-20">
      <Container>
        <h2 className="font-display text-[clamp(2rem,3.4vw,2.9rem)] leading-none text-ivory">{t("home.testimonials.title")}</h2>
        <p className="mt-2 text-sm text-smoke">{t("home.testimonials.subtitle")}</p>

        <div className="relative mt-8">
          <button type="button" className={cn(arrow, "-start-5")} onClick={() => api?.scrollPrev()} disabled={!canPrev} aria-label={t("common.previous")}>
            <ChevronLeft className="size-4 rtl:-scale-x-100" />
          </button>
          <div className="overflow-hidden" ref={ref}>
            <div className="-ms-5 flex touch-pan-y">
              {items.map((item) => (
                <figure key={item.id} className="min-w-0 shrink-0 grow-0 basis-[88%] ps-5 sm:basis-1/2 lg:basis-1/3">
                  <div className="relative flex h-full flex-col rounded-lg border border-white/10 bg-ebony p-6">
                    <Quote className="absolute end-5 top-5 size-8 text-gold/25" strokeWidth={1} />
                    <Stars value={item.rating} size={13} />
                    <blockquote className="mt-4 flex-1 text-[0.95rem] leading-relaxed text-ivory/90">“{item.quote}”</blockquote>
                    <figcaption className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gold-metal font-caps text-sm text-ink">
                        {item.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ivory">
                          {item.name}
                          {item.location ? <span className="font-normal text-mist"> · {item.location}</span> : null}
                        </span>
                        <span className="flex items-center gap-1 text-[0.68rem] text-gold/85">
                          <BadgeCheck className="size-3.5" strokeWidth={1.5} /> {t("common.verifiedBuyer")}
                          {item.product ? (
                            <>
                              {" · "}
                              <Link href={`/products/${item.product.slug}`} className="underline-offset-2 hover:underline">
                                {item.product.name}
                              </Link>
                            </>
                          ) : null}
                        </span>
                      </span>
                    </figcaption>
                  </div>
                </figure>
              ))}
            </div>
          </div>
          <button type="button" className={cn(arrow, "-end-5")} onClick={() => api?.scrollNext()} disabled={!canNext} aria-label={t("common.next")}>
            <ChevronRight className="size-4 rtl:-scale-x-100" />
          </button>
        </div>
      </Container>
    </Section>
  );
}
