import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CatalogView } from "@/components/catalog/catalog-view";
import { parseCatalogParams } from "@/lib/catalog-params";
import { photo } from "@/lib/images";
import { filterCards, getAllCards } from "@/server/queries/catalog";

export async function generateMetadata({ params }: PageProps<"/[locale]/shop">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalog" });
  return { title: t("allTitle"), description: t("allSubtitle"), alternates: { canonical: locale === "ar" ? "/ar/shop" : "/shop" } };
}

export default async function ShopPage({ params, searchParams }: PageProps<"/[locale]/shop">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [cards, t, tn] = await Promise.all([getAllCards(locale), getTranslations("catalog"), getTranslations("nav")]);
  return (
    <CatalogView
      scope={filterCards(cards, {})}
      params={parseCatalogParams(await searchParams)}
      title={t("allTitle")}
      eyebrow={tn("shop")}
      description={t("allSubtitle")}
      image={photo("crystalDecanters", 900)}
      breadcrumb={[{ label: tn("home"), href: "/" }, { label: tn("shop") }]}
    />
  );
}
