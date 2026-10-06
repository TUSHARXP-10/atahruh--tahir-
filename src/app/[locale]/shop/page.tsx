import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CatalogView } from "@/components/catalog/catalog-view";
import { CollectionJsonLd } from "@/components/seo/json-ld";
import { parseCatalogParams } from "@/lib/catalog-params";
import { photo } from "@/lib/images";
import { filterCards, getAllCards } from "@/server/queries/catalog";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/shop">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalog" });
  return pageMetadata({ locale, path: "/shop", title: t("allTitle"), description: t("allSubtitle") });
}

export default async function ShopPage({ params, searchParams }: PageProps<"/[locale]/shop">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [cards, t, tn] = await Promise.all([getAllCards(locale), getTranslations("catalog"), getTranslations("nav")]);
  const scope = filterCards(cards, {});
  return (
    <>
      <CollectionJsonLd locale={locale} path="/shop" name={t("allTitle")} description={t("allSubtitle")} products={scope} />
      <CatalogView
        scope={scope}
        params={parseCatalogParams(await searchParams)}
        title={t("allTitle")}
        eyebrow={tn("shop")}
        description={t("allSubtitle")}
        image={photo("crystalDecanters", 900)}
        breadcrumb={[{ label: tn("home"), href: "/" }, { label: tn("shop") }]}
      />
    </>
  );
}
