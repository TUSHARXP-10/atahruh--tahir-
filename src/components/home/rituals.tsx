"use client";

import { ArrowRight, Clock } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { ProductVisual } from "@/components/product/product-visual";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/money";
import type { ProductCardData } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { RitualsBlock } from "@/server/queries/content";

export function Rituals({ data, products }: { data: RitualsBlock; products: ProductCardData[] }) {
  const t = useTranslations("home.rituals");
  const locale = useLocale();
  const [active, setActive] = useState(data.items[0]?.key);
  const ritual = data.items.find((r) => r.key === active) ?? data.items[0];
  if (!ritual) return null;
  const ritualProducts = ritual.products.map((slug) => products.find((p) => p.slug === slug)).filter(Boolean) as ProductCardData[];

  return (
    <Section tone="light" className="py-14 lg:py-20">
      <Container>
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="font-display text-[clamp(2rem,3.4vw,2.9rem)] leading-none text-heading">{t("title")}</h2>
          <div className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto rounded-full px-4 sm:mx-0 sm:border sm:border-hairline sm:bg-white sm:p-1" role="tablist" aria-label={t("title")}>
            {data.items.map((r) => (
              <button
                key={r.key}
                type="button"
                role="tab"
                aria-selected={r.key === active}
                onClick={() => setActive(r.key)}
                className={cn(
                  "relative shrink-0 rounded-full px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.12em] transition-colors",
                  r.key === active ? "text-gold-pale" : "text-fg-muted hover:text-heading",
                )}
              >
                {r.key === active ? <motion.span layoutId="ritual-tab" className="absolute inset-0 -z-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 400, damping: 34 }} /> : null}
                <span className="relative">{t(`tabs.${r.key}`)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Five ritual cards */}
        <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
          {data.items.map((r) => {
            const on = r.key === active;
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => setActive(r.key)}
                className={cn(
                  "group relative aspect-[4/5] w-[62%] shrink-0 snap-start overflow-hidden rounded-lg text-start shadow-[0_18px_40px_-26px_rgba(28,21,16,0.6)] transition-transform duration-500 sm:w-[38%] lg:w-auto",
                  on ? "ring-2 ring-accent ring-offset-2 ring-offset-cream" : "hover:-translate-y-1",
                )}
                aria-pressed={on}
              >
                <Image src={r.image} alt="" fill sizes="(min-width: 1024px) 20vw, 62vw" className="object-cover transition-transform duration-[1.4s] ease-(--ease-luxe) group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-noir/90 via-noir/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="font-display text-[1.35rem] leading-tight text-ivory">{r.title}</p>
                  <p className="mt-0.5 text-[0.7rem] text-gold-light">{r.notes}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail strip for the selected ritual */}
        <AnimatePresence mode="wait">
          <motion.div
            key={ritual.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 grid gap-6 rounded-lg border border-hairline bg-white p-5 sm:p-6 grid-cols-1 lg:grid-cols-12 lg:items-center"
          >
            <div className="lg:col-span-4">
              <p className="inline-flex items-center gap-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-accent">
                <Clock className="size-3.5" /> {ritual.time}
              </p>
              <p className="mt-2 font-display text-2xl leading-snug text-heading">{ritual.description}</p>
            </div>
            <ol className="space-y-2 text-sm text-fg-muted lg:col-span-4">
              {ritual.steps.map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink text-[0.66rem] font-semibold text-gold-pale">{i + 1}</span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
            <div className="lg:col-span-4">
              <div className="flex gap-3">
                {ritualProducts.map((p) => {
                  const f = p.forms[0];
                  return (
                    <Link key={p.id} href={`/products/${p.slug}`} className="group min-w-0 flex-1">
                      <div className="relative aspect-square overflow-hidden rounded-md bg-ebony">
                        <ProductVisual form={f.type} kind={p.kind} image={f.image} name={p.name} color={p.accentColor} shape={p.bottleShape} plain sizes="120px" />
                      </div>
                      <p className="mt-1.5 truncate text-[0.74rem] font-semibold text-heading group-hover:text-accent">{p.name}</p>
                      <p className="text-[0.68rem] tabular-nums text-fg-muted">{formatPrice(p.minPrice, locale)}</p>
                    </Link>
                  );
                })}
              </div>
              <Link href="/rituals" className="mt-4 inline-flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-heading hover:text-accent">
                {t("shopRitual")} <ArrowRight className="size-3.5 rtl:-scale-x-100" />
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </Container>
    </Section>
  );
}
