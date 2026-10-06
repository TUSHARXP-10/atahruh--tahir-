import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CatalogView } from "@/components/catalog/catalog-view";
import { CollectionJsonLd } from "@/components/seo/json-ld";
import { parseCatalogParams } from "@/lib/catalog-params";
import type { FormType } from "@/lib/types";
import { cardsForCollection, getAllCards, getCollection } from "@/server/queries/catalog";
import { metaDescription, pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/collections/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const [c, t] = await Promise.all([getCollection(slug, locale), getTranslations({ locale, namespace: "meta" })]);
  if (!c) return {};
  const own = c.description || c.tagline || "";
  return pageMetadata({
    locale,
    path: `/collections/${slug}`,
    title: c.name,
    // Short admin copy gets a fuller sentence so search results show a useful snippet
    description: own.length >= 70 ? metaDescription(own) : t("collectionDescription", { name: c.name, lead: own ? `${own.replace(/[.。]$/, "")} · ` : "" }),
    images: c.imageUrl ? [{ url: c.imageUrl, alt: c.name }] : undefined,
  });
}

export default async function CollectionPage({ params, searchParams }: PageProps<"/[locale]/collections/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const [collection, cards, t] = await Promise.all([getCollection(slug, locale), getAllCards(locale), getTranslations("nav")]);
  if (!collection) notFound();

  const scope = cardsForCollection(cards, collection);
  const preferForm = collection.filter?.form && !Array.isArray(collection.filter.form) ? (collection.filter.form as FormType) : undefined;

  return (
    <>
      <CollectionJsonLd locale={locale} path={`/collections/${slug}`} name={collection.name} description={collection.description || collection.tagline} products={scope} />
      <CatalogView
        scope={scope}
        params={parseCatalogParams(await searchParams)}
        title={collection.name}
        eyebrow={collection.tagline}
        description={collection.description}
        image={collection.imageUrl}
        breadcrumb={[{ label: t("home"), href: "/" }, { label: t("shop"), href: "/shop" }, { label: collection.name }]}
        preferForm={preferForm}
        curated={!collection.filter}
      />
    </>
  );
}
