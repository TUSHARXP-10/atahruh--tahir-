import { ArrowRight, Gem, HandHeart, Leaf, PackageCheck } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Ornament } from "@/components/brand/ornament";
import { PageHero } from "@/components/layout/page-hero";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Link } from "@/i18n/navigation";
import { photo } from "@/lib/images";
import { getContent, type InspirationBlock, type StatsBlock } from "@/server/queries/content";

export async function generateMetadata({ params }: PageProps<"/[locale]/our-story">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "storyPage" });
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: { canonical: locale === "en" ? "/our-story" : `/${locale}/our-story` } };
}

const CRAFTS = [
  { key: "attar", image: photo("attarLantern"), href: "/collections/attars" },
  { key: "perfume", image: photo("goldenSpray"), href: "/collections/perfumes" },
  { key: "therapy", image: photo("dropperStones"), href: "/therapies" },
] as const;

const VALUES = [
  { key: "batches", Icon: Gem },
  { key: "ingredients", Icon: Leaf },
  { key: "packed", Icon: PackageCheck },
  { key: "care", Icon: HandHeart },
] as const;

export default async function OurStoryPage({ params }: PageProps<"/[locale]/our-story">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tNav, inspiration, stats] = await Promise.all([
    getTranslations("storyPage"),
    getTranslations("nav"),
    getContent<InspirationBlock>("inspiration", locale),
    getContent<StatsBlock>("stats", locale),
  ]);

  return (
    <>
      <PageHero breadcrumb={[{ label: tNav("home"), href: "/" }, { label: t("eyebrow") }]} eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} image={photo("archDoorway")} imagePosition="50% 40%" />

      {inspiration ? (
        <Section tone="light">
          <Container className="grid items-center gap-12 py-16 grid-cols-1 lg:grid-cols-12 lg:py-24">
            <Reveal className="lg:col-span-7">
              <figure className="relative">
                <div className="rounded-sm border border-hairline bg-surface p-2.5 shadow-[0_30px_70px_-35px_rgba(28,21,16,0.55)]">
                  <div className="relative aspect-[1032/677] overflow-hidden rounded-[2px]">
                    <Image src={inspiration.image} alt={`${inspiration.name} — ${inspiration.caption}`} fill loading="eager" fetchPriority="high" sizes="(min-width: 1024px) 56vw, 100vw" className="object-cover" />
                  </div>
                </div>
                <figcaption className="mt-3 text-xs text-fg-muted">{inspiration.name}</figcaption>
              </figure>
            </Reveal>
            <Reveal delay={0.12} className="lg:col-span-5">
              <div className="mb-4 flex items-center gap-3">
                <Ornament className="w-8" />
                <span className="eyebrow">{inspiration.eyebrow}</span>
              </div>
              <h2 className="text-display-md text-heading">{inspiration.name}</h2>
              <p className="mt-2 font-display text-xl italic text-accent">{inspiration.caption}</p>
              <p className="mt-6 text-[1.02rem] leading-relaxed text-fg-muted">{inspiration.text}</p>
              {stats?.items.length ? (
                <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-hairline pt-6">
                  {stats.items.slice(0, 4).map((s) => (
                    <div key={s.label}>
                      <dd className="font-display text-4xl leading-none text-heading">{s.value}</dd>
                      <dt className="mt-1.5 text-[0.68rem] uppercase tracking-[0.14em] text-fg-muted">{s.label}</dt>
                    </div>
                  ))}
                </dl>
              ) : null}
            </Reveal>
          </Container>
        </Section>
      ) : null}

      <Section tone="dark">
        <Container className="py-16 lg:py-24">
          <SectionHeading eyebrow={t("craftEyebrow")} title={t("craftTitle")} align="center" />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {CRAFTS.map((c, i) => (
              <Reveal key={c.key} delay={i * 0.08}>
                <Link href={c.href} className="group relative block aspect-[4/5] overflow-hidden rounded-lg border border-gold/15">
                  <Image src={c.image} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition-transform duration-[1.4s] ease-(--ease-luxe) group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-noir via-noir/40 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <h3 className="font-display text-3xl text-ivory">{t(`crafts.${c.key}.title`)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-sand/85">{t(`crafts.${c.key}.text`)}</p>
                    <ArrowRight className="mt-4 size-5 text-gold transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" strokeWidth={1.5} />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="light">
        <Container className="py-16 lg:py-24">
          <SectionHeading eyebrow={t("valuesEyebrow")} title={t("valuesTitle")} align="center" />
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ key, Icon }) => (
              <li key={key} className="rounded-lg border border-hairline bg-surface p-6">
                <span className="grid size-12 place-items-center rounded-full border border-hairline text-accent">
                  <Icon className="size-5" strokeWidth={1.4} />
                </span>
                <h3 className="mt-5 font-display text-2xl text-heading">{t(`values.${key}.title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{t(`values.${key}.text`)}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section tone="dark" className="overflow-hidden">
        <Image src={photo("amberGlow")} alt="" fill sizes="100vw" className="object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-noir via-noir/70 to-noir/40 rtl:bg-gradient-to-l" />
        <Container className="relative py-20 lg:py-24">
          <div className="max-w-xl">
            <h2 className="text-display-md text-ivory">{t("ctaTitle")}</h2>
            <p className="mt-4 text-smoke">{t("ctaText")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/fragrance-quiz">
                  {t("ctaQuiz")} <ArrowRight className="rtl:-scale-x-100" strokeWidth={1.5} />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/shop">{t("ctaShop")}</Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
