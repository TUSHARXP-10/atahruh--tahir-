"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { InstagramIcon } from "@/components/brand/social-icons";
import { useCarousel } from "@/components/product/product-carousel";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { cn } from "@/lib/utils";
import type { InstagramBlock } from "@/server/queries/content";

export function InstagramFeed({ data, profileUrl }: { data: InstagramBlock; profileUrl: string }) {
  const t = useTranslations();
  const { ref, api, canPrev, canNext } = useCarousel({ loop: false });
  const arrow =
    "absolute top-1/2 z-10 hidden size-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-noir/80 text-ivory backdrop-blur transition-colors hover:border-gold hover:text-gold-light disabled:pointer-events-none disabled:opacity-0 md:grid";

  return (
    <Section tone="dark" className="py-14 lg:py-16" aria-label={t("home.instagram.title")}>
      <Container>
        <div className="mb-7 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 className="font-display text-[clamp(2rem,3.4vw,2.9rem)] leading-none text-ivory">{t("home.instagram.title")}</h2>
          <a href={profileUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-gold-light hover:text-gold" dir="ltr">
            {data.handle}
          </a>
        </div>
        <div className="relative">
          <button type="button" className={cn(arrow, "-start-5")} onClick={() => api?.scrollPrev()} disabled={!canPrev} aria-label={t("common.previous")}>
            <ChevronLeft className="size-4 rtl:-scale-x-100" />
          </button>
          <div className="overflow-hidden" ref={ref}>
            <div className="-ms-3 flex">
              {data.tiles.map((src, i) => (
                <a
                  key={`${src}-${i}`}
                  href={profileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group block min-w-0 shrink-0 grow-0 basis-1/3 ps-3 sm:basis-1/4 lg:basis-1/6 xl:basis-[12.5%]"
                  aria-label={`${data.handle} — Instagram`}
                >
                  <span className="relative block aspect-square overflow-hidden rounded-md">
                    <Image src={src} alt="" fill sizes="(min-width: 1280px) 12vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                    <span className="absolute inset-0 grid place-items-center bg-noir/0 text-transparent transition-colors duration-500 group-hover:bg-noir/50 group-hover:text-gold-light">
                      <InstagramIcon className="size-6" />
                    </span>
                  </span>
                </a>
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
