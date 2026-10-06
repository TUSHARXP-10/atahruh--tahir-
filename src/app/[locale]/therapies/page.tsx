import { Bath, Droplets, HandHeart, ShieldAlert, Wind } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/layout/page-hero";
import { CardGrid } from "@/components/product/card-grid";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { photo } from "@/lib/images";
import { getAllCards, sortCards } from "@/server/queries/catalog";

const NEEDS = ["STRESS", "SLEEP", "FOCUS", "SKIN_HAIR", "BALANCE"] as const;
const HOW = [
  { key: "diffuse", Icon: Wind },
  { key: "inhale", Icon: Droplets },
  { key: "massage", Icon: HandHeart },
  { key: "bath", Icon: Bath },
] as const;

export async function generateMetadata({ params }: PageProps<"/[locale]/therapies">): Promise<Metadata> {
  const { locale } = await params;
  const [t, tNav] = await Promise.all([getTranslations({ locale, namespace: "therapiesPage" }), getTranslations({ locale, namespace: "nav" })]);
  return { title: tNav("therapies"), description: t("metaDescription"), alternates: { canonical: locale === "en" ? "/therapies" : `/${locale}/therapies` } };
}

export default async function TherapiesPage({ params }: PageProps<"/[locale]/therapies">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tNav, tTiles, cards] = await Promise.all([getTranslations("therapiesPage"), getTranslations("nav"), getTranslations("home.therapyTiles"), getAllCards(locale)]);
  const therapies = sortCards(
    cards.filter((c) => c.kind === "THERAPY"),
    "featured",
  );

  return (
    <>
      <PageHero breadcrumb={[{ label: tNav("home"), href: "/" }, { label: tNav("therapies") }]} eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} image={photo("waterfall")} imagePosition="50% 60%">
        <nav aria-label={t("byNeed")} className="flex flex-wrap gap-2">
          {NEEDS.map((n) => (
            <a key={n} href={`#${n.toLowerCase()}`} className="rounded-full border border-gold/30 px-4 py-1.5 text-xs text-sand transition-colors hover:border-gold hover:text-gold-light">
              {tTiles(n)}
            </a>
          ))}
        </nav>
      </PageHero>

      <Section tone="light">
        <Container className="space-y-16 py-14 lg:space-y-20 lg:py-20">
          {NEEDS.map((n) => {
            const products = therapies.filter((c) => c.needs.includes(n));
            return (
              <section key={n} id={n.toLowerCase()} className="scroll-mt-28">
                <SectionHeading title={tTiles(n)} subtitle={t(`needs.${n}`)} />
                <div className="mt-8">{products.length ? <CardGrid products={products} /> : <p className="text-sm text-fg-muted">{t("empty")}</p>}</div>
              </section>
            );
          })}
        </Container>
      </Section>

      <Section tone="dark">
        <Container className="py-16 lg:py-24">
          <SectionHeading eyebrow={t("eyebrow")} title={t("howTitle")} align="center" />
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {HOW.map(({ key, Icon }) => (
              <li key={key} className="rounded-lg border border-gold/15 bg-ebony/60 p-6">
                <Icon className="size-6 text-gold" strokeWidth={1.3} />
                <h3 className="mt-4 font-display text-2xl text-ivory">{t(`how.${key}.title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-smoke">{t(`how.${key}.text`)}</p>
              </li>
            ))}
          </ul>
          <div className="mx-auto mt-10 flex max-w-3xl gap-4 rounded-lg border border-gold/25 bg-gold/5 p-5">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-gold" strokeWidth={1.5} />
            <div>
              <p className="font-semibold text-ivory">{t("safetyTitle")}</p>
              <p className="mt-1 text-sm leading-relaxed text-smoke">{t("safety")}</p>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
