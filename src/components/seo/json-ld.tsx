import { absoluteUrl, localePath } from "@/lib/seo";
import { site } from "@/lib/site";
import type { ProductDetail } from "@/server/queries/catalog";
import type { getSettings } from "@/server/queries/content";

type Settings = Awaited<ReturnType<typeof getSettings>>;

/** Renders a JSON-LD script. `<` is escaped so content can never break out of the tag. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/** Stable ids so pages can refer to the store and site without repeating them. */
export const ORG_ID = `${site.url}/#organization`;
export const WEBSITE_ID = `${site.url}/#website`;

/** Social profiles that point at a real account — the placeholders (bare domains) are left out. */
function profileLinks(socials: Record<string, string>) {
  return Object.values(socials).filter((u) => {
    try {
      return new URL(u).pathname.replace(/\//g, "").length > 0;
    } catch {
      return false;
    }
  });
}

/** Unopened items within 7 days of delivery — mirrors the Returns policy page. */
export function returnPolicy(locale: string) {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "IN",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 7,
    returnMethod: "https://schema.org/ReturnByMail",
    merchantReturnLink: absoluteUrl(localePath(locale, "/policies/returns")),
  };
}

/** The store and the website — on the home page, where search engines look for them. */
export function SiteJsonLd({ locale, settings }: { locale: string; settings: Settings }) {
  const sameAs = profileLinks(settings.socials);
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "OnlineStore",
            "@id": ORG_ID,
            name: site.name,
            alternateName: [site.nameAr, site.meaning],
            url: site.url,
            logo: { "@type": "ImageObject", url: absoluteUrl("/brand/logo-on-light.png"), width: 684, height: 764 },
            image: absoluteUrl("/og/site"),
            description: site.description,
            slogan: site.tagline,
            email: settings.contact.email,
            telephone: settings.contact.phone,
            address: { "@type": "PostalAddress", addressLocality: "Mumbai", addressRegion: "Maharashtra", addressCountry: "IN" },
            areaServed: { "@type": "Country", name: "India" },
            currenciesAccepted: "INR",
            paymentAccepted: "Cash on delivery, UPI, Credit card, Debit card, Net banking, Wallets",
            ...(sameAs.length ? { sameAs } : {}),
            hasMerchantReturnPolicy: returnPolicy(locale),
            contactPoint: {
              "@type": "ContactPoint",
              email: settings.contact.email,
              telephone: settings.contact.phone,
              contactType: "customer service",
              areaServed: "IN",
              availableLanguage: ["English", "Arabic", "Hindi"],
            },
          },
          {
            "@type": "WebSite",
            "@id": WEBSITE_ID,
            name: site.name,
            alternateName: site.nameAr,
            url: absoluteUrl(localePath(locale, "/")),
            inLanguage: locale,
            publisher: { "@id": ORG_ID },
            potentialAction: {
              "@type": "SearchAction",
              target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl(localePath(locale, "/search"))}?q={search_term_string}` },
              "query-input": "required name=search_term_string",
            },
          },
        ],
      }}
    />
  );
}

type Review = { authorName: string; rating: number; title: string | null; body: string; createdAt: Date };

/** Product rich result: one offer per size and form, with delivery and returns. */
export function ProductJsonLd({ product, locale, reviews, settings }: { product: ProductDetail; locale: string; reviews: Review[]; settings: Settings }) {
  const url = absoluteUrl(localePath(locale, `/products/${product.slug}`));
  const { freeShippingThreshold, standardShippingFee } = settings.commerce;
  const images = [...new Set(product.formDetails.flatMap((f) => f.images.map((i) => absoluteUrl(i.url))))].slice(0, 6);
  const offers = product.forms.flatMap((f) =>
    f.variants.map((v) => ({
      "@type": "Offer",
      sku: v.id,
      name: `${product.name} ${f.type === "SET" ? "" : f.type.toLowerCase()} ${v.label}`.replace(/\s+/g, " ").trim(),
      url,
      price: (v.price / 100).toFixed(2),
      priceCurrency: "INR",
      itemCondition: "https://schema.org/NewCondition",
      availability: v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@id": ORG_ID },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: v.price >= freeShippingThreshold ? 0 : standardShippingFee / 100, currency: "INR" },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "IN" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 9, unitCode: "DAY" },
        },
      },
      hasMerchantReturnPolicy: returnPolicy(locale),
    })),
  );

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Product",
        "@id": `${url}#product`,
        name: product.name,
        description: product.story,
        url,
        image: images,
        brand: { "@type": "Brand", name: site.name },
        sku: product.slug,
        category: product.family ?? product.kind,
        ...(product.notes.length ? { keywords: product.notes.join(", ") } : {}),
        ...(product.rating.count
          ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating.avg.toFixed(1), reviewCount: product.rating.count, bestRating: 5, worstRating: 1 } }
          : {}),
        ...(reviews.length
          ? {
              review: reviews.slice(0, 5).map((r) => ({
                "@type": "Review",
                author: { "@type": "Person", name: r.authorName },
                datePublished: new Date(r.createdAt).toISOString().slice(0, 10),
                ...(r.title ? { name: r.title } : {}),
                reviewBody: r.body,
                reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
              })),
            }
          : {}),
        offers,
      }}
    />
  );
}

/** A shop or collection page as a list of the products on it. */
export function CollectionJsonLd({ locale, path, name, description, products }: { locale: string; path: string; name: string; description?: string; products: { slug: string; name: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name,
        ...(description ? { description } : {}),
        url: absoluteUrl(localePath(locale, path)),
        inLanguage: locale,
        isPartOf: { "@id": WEBSITE_ID },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: products.length,
          itemListElement: products.slice(0, 50).map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: absoluteUrl(localePath(locale, `/products/${p.slug}`)),
            name: p.name,
          })),
        },
      }}
    />
  );
}
