import { ArrowRight, Clock } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/layout/page-hero";
import { Reveal } from "@/components/motion/reveal";
import { CardGrid } from "@/components/product/card-grid";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";
import { photo } from "@/lib/images";
import { cn } from "@/lib/utils";
import { getAllCards } from "@/server/queries/catalog";
import { getContent, type RitualsBlock } from "@/server/queries/content";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/rituals">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ritualsPage" });
  return pageMetadata({ locale, path: "/rituals", title: t("title"), description: t("metaDescription") });
}

export default async function RitualsPage({ params }: PageProps<"/[locale]/rituals">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tNav, rituals, cards] = await Promise.all([getTranslations("ritualsPage"), getTranslations("nav"), getContent<RitualsBlock>("rituals", locale), getAllCards(locale)]);
  const items = rituals?.items ?? [];

  return (
    <>
      <PageHero breadcrumb={[{ label: tNav("home"), href: "/" }, { label: tNav("rituals") }]} eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} image={photo("candleCosy")}>
        <nav className="flex flex-wrap gap-2" aria-label={t("title")}>
          {items.map((r) => (
            <a key={r.key} href={`#${r.key}`} className="rounded-full border border-gold/30 px-4 py-1.5 text-xs text-sand transition-colors hover:border-gold hover:text-gold-light">
              {r.title}
            </a>
          ))}
        </nav>
      </PageHero>

      {items.map((r, i) => {
        const products = r.products.map((slug) => cards.find((c) => c.slug === slug)).filter((c): c is NonNullable<typeof c> => !!c);
        const light = i % 2 === 0;
        return (
          <Section key={r.key} id={r.key} tone={light ? "light" : "dark"} className="scroll-mt-24">
            <Container className="py-16 lg:py-24">
              <div className="grid items-center gap-10 grid-cols-1 lg:grid-cols-12">
                <Reveal className={cn("lg:col-span-5", !light && "lg:order-2 lg:col-start-8")}>
                  <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
                    {r.image ? <Image src={r.image} alt="" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" /> : null}
                    <span className="absolute start-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-noir/70 px-3 py-1.5 text-xs text-gold-light backdrop-blur">
                      <Clock className="size-3.5" /> {r.time}
                    </span>
                  </div>
                </Reveal>
                <Reveal delay={0.1} className={cn("lg:col-span-6", light ? "lg:col-start-7" : "lg:order-1 lg:col-start-1")}>
                  <p className="eyebrow">
                    {String(i + 1).padStart(2, "0")} · {r.notes}
                  </p>
                  <h2 className="mt-3 text-display-md text-heading">{r.title}</h2>
                  <p className="mt-4 text-[1.02rem] leading-relaxed text-fg-muted">{r.description}</p>
                  <p className="mt-8 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-accent">{t("steps")}</p>
                  <ol className="mt-3 space-y-3">
                    {r.steps.map((s, k) => (
                      <li key={s} className="flex gap-4">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full border border-hairline font-display text-lg text-accent">{k + 1}</span>
                        <span className="pt-1 text-[0.98rem] text-heading">{s}</span>
                      </li>
                    ))}
                  </ol>
                </Reveal>
              </div>
              {products.length ? (
                <div className="mt-12">
                  <p className="mb-4 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-accent">{t("products")}</p>
                  <CardGrid products={products} className="xl:grid-cols-4" />
                </div>
              ) : null}
            </Container>
          </Section>
        );
      })}

      <Section tone="dark" className="border-t border-white/5">
        <Container className="flex justify-center py-14">
          <Button asChild>
            <Link href="/therapies">
              {t("shopAll")} <ArrowRight className="rtl:-scale-x-100" strokeWidth={1.5} />
            </Link>
          </Button>
        </Container>
      </Section>
    </>
  );
}
