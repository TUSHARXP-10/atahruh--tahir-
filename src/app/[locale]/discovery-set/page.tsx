import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DiscoveryBuilder, type Candidate } from "@/components/discovery/discovery-builder";
import { PageHero } from "@/components/layout/page-hero";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { db } from "@/lib/db";
import { photo } from "@/lib/images";
import { getAllCards, sortCards } from "@/server/queries/catalog";
import { getSettings } from "@/server/queries/content";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/discovery-set">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "discovery" });
  return pageMetadata({ locale, path: "/discovery-set", title: t("metaTitle"), description: t("metaDescription") });
}

export default async function DiscoverySetPage({ params, searchParams }: PageProps<"/[locale]/discovery-set">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [sp, t, tNav, tFam, cards, { commerce }, set] = await Promise.all([
    searchParams,
    getTranslations("discovery"),
    getTranslations("nav"),
    getTranslations("families"),
    getAllCards(locale),
    getSettings(),
    db.product.findFirst({
      where: { kind: "DISCOVERY_SET", status: "ACTIVE" },
      select: { forms: { take: 1, select: { variants: { orderBy: { position: "asc" }, take: 1, select: { id: true, price: true, stock: true } } } } },
    }),
  ]);
  const variant = set?.forms[0]?.variants[0] ?? null;

  const candidates: Candidate[] = sortCards(
    cards.filter((c) => c.kind === "FRAGRANCE" && c.isSampleable),
    "featured",
  ).map((c) => {
    const forms = c.forms.filter((f): f is typeof f & { type: "PERFUME" | "ATTAR" } => f.type === "PERFUME" || f.type === "ATTAR");
    return {
      id: c.id,
      name: c.name,
      family: c.family,
      familyLabel: c.family ? tFam(c.family) : "",
      notes: c.notes,
      color: c.accentColor,
      image: forms[0]?.image ?? null,
      forms: forms.map((f) => f.type),
    };
  }).filter((c) => c.forms.length);

  // ?picks=id,id,… from the Fragrance Score results pre-fills the tray
  const picked = typeof sp.picks === "string" ? sp.picks.split(",").filter(Boolean) : [];
  const initialPicks = picked
    .map((id) => candidates.find((c) => c.id === id))
    .filter((c): c is Candidate => !!c)
    .slice(0, commerce.discoverySetSize)
    .map((c) => ({ productId: c.id, form: c.forms[0] }));

  return (
    <>
      <PageHero breadcrumb={[{ label: tNav("home"), href: "/" }, { label: t("eyebrow") }]} eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} image={photo("labVials")} compact>
        <ol className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-sand">
          {(t.raw("steps") as string[]).map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-full border border-gold/40 text-xs text-gold">{i + 1}</span> {s}
            </li>
          ))}
        </ol>
      </PageHero>
      <Section tone="light">
        <Container className="py-12 lg:py-16">
          <DiscoveryBuilder
            candidates={candidates}
            size={commerce.discoverySetSize}
            variantId={variant?.id ?? null}
            price={variant?.price ?? commerce.discoverySetPrice}
            available={!!variant && variant.stock > 0}
            initialPicks={initialPicks}
            fromQuiz={initialPicks.length > 0}
          />
        </Container>
      </Section>
    </>
  );
}
