"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { dirFor } from "@/i18n/routing";
import type { ProductCardData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProductCard } from "./product-card";
import { useQuickView } from "./quick-view";

export function useCarousel(options?: { loop?: boolean }) {
  const locale = useLocale();
  const [ref, api] = useEmblaCarousel({
    align: "start",
    direction: dirFor(locale),
    containScroll: "trimSnaps",
    dragFree: false,
    loop: options?.loop ?? false,
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    if (!api) return;
    setCanPrev(api.canScrollPrev());
    setCanNext(api.canScrollNext());
  }, [api]);

  useEffect(() => {
    if (!api) return;
    // First reading on the next frame, then on every change
    const frame = requestAnimationFrame(update);
    api.on("select", update).on("reInit", update);
    return () => {
      cancelAnimationFrame(frame);
      api.off("select", update).off("reInit", update);
    };
  }, [api, update]);

  return { ref, api, canPrev, canNext };
}

export function CarouselArrows({
  api,
  canPrev,
  canNext,
  className,
}: {
  api: ReturnType<typeof useCarousel>["api"];
  canPrev: boolean;
  canNext: boolean;
  className?: string;
}) {
  const t = useTranslations("common");
  const btn =
    "grid size-11 place-items-center rounded-full border border-hairline bg-surface text-heading shadow-sm transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-30";
  return (
    <div className={cn("flex gap-2", className)}>
      <button type="button" className={btn} onClick={() => api?.scrollPrev()} disabled={!canPrev} aria-label={t("previous")}>
        <ChevronLeft className="size-4 rtl:-scale-x-100" strokeWidth={1.25} />
      </button>
      <button type="button" className={btn} onClick={() => api?.scrollNext()} disabled={!canNext} aria-label={t("next")}>
        <ChevronRight className="size-4 rtl:-scale-x-100" strokeWidth={1.25} />
      </button>
    </div>
  );
}

export function ProductCarousel({
  products,
  header,
  className,
}: {
  products: ProductCardData[];
  header?: (arrows: ReactNode) => ReactNode;
  className?: string;
}) {
  const { ref, api, canPrev, canNext } = useCarousel();
  const quickView = useQuickView();

  useEffect(() => {
    api?.reInit();
    api?.scrollTo(0, true);
  }, [api, products]);

  return (
    <div className={className}>
      {header ? header(<CarouselArrows api={api} canPrev={canPrev} canNext={canNext} />) : null}
      <div className="overflow-hidden" ref={ref}>
        <div className="-ms-5 flex touch-pan-y">
          {products.map((p, i) => (
            <div key={p.id} className="min-w-0 shrink-0 grow-0 basis-[72%] ps-5 sm:basis-[44%] md:basis-[33.333%] lg:basis-[25%] xl:basis-[20%]">
              <ProductCard product={p} priority={i < 2} onQuickView={quickView.open} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
