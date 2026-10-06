import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductFormProvider } from "@/components/product/form-context";
import { NotesPyramid, Reviews, ScentProfile } from "@/components/product/product-details";
import { ProductExperience } from "@/components/product/product-experience";
import { getSettings } from "@/server/queries/content";
import { getSessionUser } from "@/server/session";
import { ProductRail, RecentlyViewed } from "@/components/product/product-rail";
import { ProductJsonLd } from "@/components/seo/json-ld";
import { Container } from "@/components/ui/container";
import { formatPrice } from "@/lib/money";
import { metaDescription, pageMetadata } from "@/lib/seo";
import type { FormType } from "@/lib/types";
import { getAllCards, getProductDetail, getProductReviews, sortCards } from "@/server/queries/catalog";

export async function generateMetadata({ params }: PageProps<"/[locale]/products/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const [p, t] = await Promise.all([getProductDetail(slug, locale), getTranslations({ locale, namespace: "meta" })]);
  if (!p) return {};
  const image = p.formDetails[0]?.images[0];
  const formLabel = { PERFUME: t("productFormPerfume"), ATTAR: t("productFormAttar"), OIL: t("productFormOil"), SET: t("productFormSet") };
  const forms = new Intl.ListFormat(locale, { type: "disjunction" }).format(p.forms.map((f) => formLabel[f.type]));
  const tagline = p.tagline.replace(/[.。]$/, "");
  // The SEO title and description from Admin → Products are written in English. An older
  // seed copied the first 155 characters of the story there; those cut-offs are ignored.
  const own = locale === "en";
  const seoDescription = p.seoDescription && !(p.story.startsWith(p.seoDescription) && p.story.length > p.seoDescription.length) ? p.seoDescription : null;
  return pageMetadata({
    locale,
    path: `/products/${slug}`,
    title: (own && p.seoTitle?.replace(/[.。]$/, "")) || t("productTitle", { name: p.name, tagline }),
    description: (own && seoDescription) || metaDescription(t("productDescription", { name: p.name, tagline, forms, price: formatPrice(p.minPrice, locale) }), 200),
    images: [
      { url: `/og/product/${slug}?locale=${locale}`, width: 1200, height: 630, alt: p.name },
      ...(image ? [{ url: image.url, alt: image.alt }] : []),
    ],
  });
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

  return (
    <ProductFormProvider initialForm={initialForm} defaultForm={defaultForm}>
      <ProductJsonLd product={product} locale={locale} reviews={reviews} settings={settings} />
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
