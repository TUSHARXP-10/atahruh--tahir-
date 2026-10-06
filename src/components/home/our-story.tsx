import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";
import { photo } from "@/lib/images";
import type { InspirationBlock, StatsBlock } from "@/server/queries/content";

/**
 * Full-bleed atmospheric band: the story and (real) figures on the start side,
 * the framed portrait of the house's inspiration on the end side.
 */
export async function OurStory({ stats, inspiration }: { stats: StatsBlock | null; inspiration: InspirationBlock | null }) {
  const t = await getTranslations("home.story");
  return (
    <Section tone="dark" className="overflow-hidden">
      <Image src={photo("arabianNight")} alt="" fill sizes="100vw" className="object-cover object-[50%_45%]" />
      <div className="absolute inset-0 bg-gradient-to-r from-noir via-noir/70 to-noir/85 rtl:bg-gradient-to-l" />
      <div className="absolute inset-0 bg-gradient-to-t from-noir/70 via-transparent to-noir/60" />

      <Container className="relative grid items-center gap-12 py-20 grid-cols-1 lg:grid-cols-12 lg:py-28">
        <Reveal className="lg:col-span-5">
          <h2 className="font-display text-[clamp(2.4rem,4.2vw,3.7rem)] leading-[1.02] text-ivory">
            {t("eyebrow")}
            <span className="block text-[0.62em] leading-tight text-gold-light">{t("title")}</span>
          </h2>
          <p className="mt-6 max-w-md leading-relaxed text-ivory/80">{t("text")}</p>
          {stats?.items.length ? (
            <dl className="mt-8 grid max-w-md grid-cols-2 gap-x-6 gap-y-5 border-t border-white/12 pt-6 sm:grid-cols-4 sm:gap-x-4">
              {stats.items.slice(0, 4).map((s) => (
                <div key={s.label}>
                  <dd className="font-display text-3xl leading-none text-gold-light">{s.value}</dd>
                  <dt className="mt-1.5 text-[0.62rem] uppercase leading-snug tracking-[0.12em] text-ivory/65">{s.label}</dt>
                </div>
              ))}
            </dl>
          ) : null}
          <Button asChild className="mt-8">
            <Link href="/our-story">
              {t("cta")} <ArrowRight className="rtl:-scale-x-100" strokeWidth={1.5} />
            </Link>
          </Button>
        </Reveal>

        {inspiration?.image ? (
          <Reveal delay={0.15} className="lg:col-span-6 lg:col-start-7">
            <figure className="relative">
              <div className="relative rounded-sm border border-gold/35 p-2 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
                <div className="relative aspect-[1032/677] overflow-hidden rounded-[2px]">
                  <Image src={inspiration.image} alt={`${inspiration.name} — ${inspiration.caption}`} fill sizes="(min-width: 1024px) 46vw, 100vw" className="object-cover" />
                </div>
              </div>
              <figcaption className="mt-5 flex items-start gap-4">
                <span className="mt-2 h-px w-10 shrink-0 bg-gold" aria-hidden />
                <span>
                  <span className="eyebrow block text-[0.62rem]">{inspiration.eyebrow}</span>
                  <span className="mt-1 block font-display text-3xl text-ivory">{inspiration.name}</span>
                  <span className="block text-sm text-smoke">{inspiration.caption}</span>
                </span>
              </figcaption>
            </figure>
          </Reveal>
        ) : null}
      </Container>
    </Section>
  );
}
