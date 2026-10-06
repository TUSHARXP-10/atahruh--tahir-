import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductFormProvider } from "@/components/product/form-context";
import { NotesPyramid, Reviews, ScentProfile } from "@/components/product/product-details";
import { ProductExperience } from "@/components/product/product-experience";
import { getSettings } from "@/server/queries/content";
import { getSessionUser } from "@/server/session";
import { ProductRail, RecentlyViewed } from "@/components/product/product-rail";
import { JsonLd } from "@/components/seo/json-ld";
import { Container } from "@/components/ui/container";
import { site } from "@/lib/site";
import type { FormType } from "@/lib/types";
import { getAllCards, getProductDetail, getProductReviews, sortCards } from "@/server/queries/catalog";

export async function generateMetadata({ params }: PageProps<"/[locale]/products/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = await getProductDetail(slug, locale);
  if (!p) return {};
  const image = p.formDetails[0]?.images[0]?.url;
  return {
    title: `${p.name} — ${p.tagline}`,
    description: p.story.slice(0, 160),
    alternates: {
      canonical: `${locale === "ar" ? "/ar" : ""}/products/${slug}`,
      languages: { en: `/products/${slug}`, ar: `/ar/products/${slug}` },
    },
    openGraph: { type: "website", title: p.name, description: p.tagline, images: [`/og/product/${slug}?locale=${locale}`, ...(image ? [image] : [])] },
  };
}

export default async function ProductPage({ params, searchParams }: PageProps<"/[locale]/products/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const [product, cards, t, sp, settings] = await Promise.all([getProductDetail(slug, locale), getAllCards(locale), getTranslations(), searchParams, getSettings()]);
  if (!product || product.kind === "DISCOVERY_SET") notFound();

  const requested = typeof sp.form === "string" ? (sp.form.toUpperCase() as FormType) : null;
  const defaultForm = product.forms[0].type;
  const initialForm = requested && product.forms.some((f) => f.type === requested) ? requested : defaultForm;

  const [{ reviews, distribution }, user] = await Promise.all([getProductReviews(product.id), getSessionUser()]);
  const pairs = product.pairIds.map((id) => cards.find((c) => c.id === id)).filter(Boolean) as typeof cards;
  const similar = sortCards(
    cards.filter((c) => c.id !== product.id && !product.pairIds.includes(c.id) && c.kind === product.kind && (product.family ? c.family === product.family || c.gender === product.gender : true)),
    "featured",
  ).slice(0, 10);

  const primaryCollection = product.collections.find((c) => ["perfumes", "attars", "therapies", "gift-sets"].includes(c.slug)) ?? product.collections[0];
  const offers = product.forms.flatMap((f) => f.variants);

  return (
    <ProductFormProvider initialForm={initialForm} defaultForm={defaultForm}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.story,
          brand: { "@type": "Brand", name: site.name },
          sku: offers[0]?.id,
          category: product.family ?? product.kind,
          image: product.formDetails.flatMap((f) => f.images.map((i) => i.url)).slice(0, 4),
          ...(product.rating.count
            ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating.avg, reviewCount: product.rating.count } }
            : {}),
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "INR",
            lowPrice: Math.min(...offers.map((v) => v.price)) / 100,
            highPrice: Math.max(...offers.map((v) => v.price)) / 100,
            offerCount: offers.length,
            availability: offers.some((v) => v.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          },
        }}
      />
      <Container className="pb-16 pt-8 lg:pb-24 lg:pt-12">
        <ProductExperience
          product={product}
          freeShippingThreshold={settings.commerce.freeShippingThreshold}
          breadcrumb={[
            { label: t("nav.home"), href: "/" },
            ...(primaryCollection ? [{ label: primaryCollection.name, href: `/collections/${primaryCollection.slug}` }] : [{ label: t("nav.shop"), href: "/shop" }]),
            { label: product.name },
          ]}
        />
      </Container>
      <NotesPyramid product={product} />
      <ScentProfile product={product} />
      {pairs.length ? <ProductRail eyebrow={product.name} title={t("product.layerWith")} products={pairs} /> : null}
      <Reviews productId={product.id} defaultName={user?.name} reviews={reviews} distribution={distribution} rating={product.rating} />
      <ProductRail title={t("product.youMayLike")} products={similar} />
      <RecentlyViewed title={t("product.recentlyViewed")} exclude={product.slug} />
    </ProductFormProvider>
  );
}
