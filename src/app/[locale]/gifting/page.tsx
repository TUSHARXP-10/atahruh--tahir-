import { ArrowRight, Briefcase, Gift, ReceiptText } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { GiftFinder } from "@/components/gifting/gift-finder";
import { PageHero } from "@/components/layout/page-hero";
import { CardGrid } from "@/components/product/card-grid";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Link } from "@/i18n/navigation";
import { photo } from "@/lib/images";
import { formatPrice } from "@/lib/money";
import { getAllCards, sortCards } from "@/server/queries/catalog";
import { getSettings } from "@/server/queries/content";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/gifting">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "giftingPage" });
  return pageMetadata({ locale, path: "/gifting", title: t("title"), description: t("metaDescription") });
}

export default async function GiftingPage({ params }: PageProps<"/[locale]/gifting">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tNav, cards, settings] = await Promise.all([getTranslations("giftingPage"), getTranslations("nav"), getAllCards(locale), getSettings()]);
  const giftable = sortCards(
    cards.filter((c) => c.kind !== "DISCOVERY_SET"),
    "featured",
  );
  const sets = giftable.filter((c) => c.kind === "GIFT_SET");
  const fee = formatPrice(settings.commerce.giftWrapFee, locale);

  return (
    <>
      <PageHero breadcrumb={[{ label: tNav("home"), href: "/" }, { label: t("eyebrow") }]} eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} image={photo("giftBlackGold")} />

      <Section tone="light">
        <Container className="py-14 lg:py-20">
          <SectionHeading title={t("finderTitle")} subtitle={t("finderText")} />
          <div className="mt-8">
            <GiftFinder products={giftable} />
          </div>
        </Container>
      </Section>

      {sets.length ? (
        <Section tone="dark">
          <Container className="py-14 lg:py-20">
            <SectionHeading title={t("setsTitle")} subtitle={t("setsText")} action={<Link href="/collections/gift-sets" className="text-sm text-gold hover:text-gold-light">{tNav("giftSets")} →</Link>} />
            <div className="mt-8">
              <CardGrid products={sets} />
            </div>
          </Container>
        </Section>
      ) : null}

      <Section tone="light">
        <Container className="grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
            <Image src={photo("labVials")} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
          <div>
            <h2 className="text-display-md text-heading">{t("discoveryTitle")}</h2>
            <p className="mt-4 leading-relaxed text-fg-muted">{t("discoveryText")}</p>
            <Button asChild className="mt-8">
              <Link href="/discovery-set">
                {t("discoveryCta")} <ArrowRight className="rtl:-scale-x-100" strokeWidth={1.5} />
              </Link>
            </Button>
          </div>
        </Container>
      </Section>

      <Section tone="dark">
        <Container className="py-14 lg:py-20">
          <SectionHeading title={t("servicesTitle")} align="center" />
          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {(
              [
                ["wrap", Gift],
                ["invoice", ReceiptText],
                ["corporate", Briefcase],
              ] as const
            ).map(([key, Icon]) => (
              <li key={key} className="rounded-lg border border-gold/15 bg-ebony/60 p-6">
                <Icon className="size-6 text-gold" strokeWidth={1.3} />
                <h3 className="mt-4 font-display text-2xl text-ivory">{t(`services.${key}.title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-smoke">{t(`services.${key}.text`, { fee })}</p>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex justify-center">
            <Button asChild variant="outline">
              <Link href="/contact">{t("corporateCta")}</Link>
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
