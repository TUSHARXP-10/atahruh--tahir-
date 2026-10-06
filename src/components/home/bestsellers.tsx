"use client";

import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product/product-card";
import { useCarousel } from "@/components/product/product-carousel";
import { useQuickView } from "@/components/product/quick-view";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";
import type { ProductCardData } from "@/lib/types";
import { cn } from "@/lib/utils";

export type BestsellerTabs = Record<"all" | "men" | "women" | "attars" | "gifts", ProductCardData[]>;

export function Bestsellers({ tabs }: { tabs: BestsellerTabs }) {
  const t = useTranslations("home.bestsellers");
  const tc = useTranslations("common");
  const [tab, setTab] = useState<keyof BestsellerTabs>("all");
  const keys = (Object.keys(tabs) as (keyof BestsellerTabs)[]).filter((k) => tabs[k].length > 0);
  const products = tabs[tab];
  const { ref, api, canPrev, canNext } = useCarousel();
  const quickView = useQuickView();

  useEffect(() => {
    api?.reInit();
    api?.scrollTo(0, true);
  }, [api, tab]);

  const arrow =
    "absolute top-[38%] z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-hairline bg-white text-ink shadow-md transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-0 md:grid";

  return (
    <Section tone="light" className="py-14 lg:py-20">
      <Container>
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="font-display text-[clamp(2rem,3.4vw,2.9rem)] leading-none text-heading">{t("title")}</h2>
          <div className="no-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label={t("title")}>
            {keys.map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={cn(
                  "relative shrink-0 px-0.5 pb-1.5 pt-3 text-[0.74rem] font-semibold uppercase tracking-[0.14em] transition-colors",
                  tab === k ? "text-heading" : "text-fg-muted hover:text-heading",
                )}
              >
                {t(`tabs.${k}`)}
                {tab === k ? <motion.span layoutId="bestseller-underline" className="absolute inset-x-0 -bottom-px h-0.5 bg-accent" /> : null}
              </button>
            ))}
          </div>
          <Link href="/collections/bestsellers" className="hidden items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-heading hover:text-accent lg:inline-flex">
            {tc("viewAll")} <ArrowRight className="size-3.5 rtl:-scale-x-100" />
          </Link>
        </div>

        <div className="relative">
          <button type="button" className={cn(arrow, "-start-5")} onClick={() => api?.scrollPrev()} disabled={!canPrev} aria-label={tc("previous")}>
            <ChevronLeft className="size-4 rtl:-scale-x-100" />
          </button>
          <div className="overflow-hidden" ref={ref}>
            <div className="-ms-4 flex touch-pan-y">
              {products.map((p, i) => (
                <div key={p.id} className="min-w-0 shrink-0 grow-0 basis-1/2 ps-4 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                  <ProductCard product={p} priority={i < 3} onQuickView={quickView.open} preferForm={tab === "attars" ? "ATTAR" : undefined} />
                </div>
              ))}
            </div>
          </div>
          <button type="button" className={cn(arrow, "-end-5")} onClick={() => api?.scrollNext()} disabled={!canNext} aria-label={tc("next")}>
            <ChevronRight className="size-4 rtl:-scale-x-100" />
          </button>
        </div>

        <Link href="/collections/bestsellers" className="mt-8 inline-flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-heading lg:hidden">
          {tc("viewAll")} <ArrowRight className="size-3.5 rtl:-scale-x-100" />
        </Link>
      </Container>
    </Section>
  );
}
