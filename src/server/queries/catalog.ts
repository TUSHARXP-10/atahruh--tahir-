import "server-only";
import { unstable_cache } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { showDemoContent } from "@/lib/demo";
import type {
  CardForm,
  CatalogFilter,
  CatalogSort,
  FormType,
  ProductCardData,
  ProductKind,
} from "@/lib/types";
import { tr } from "@/lib/utils";

export const CATALOG_TAG = "catalog";
export const REVIEWS_TAG = "reviews";
export const CONTENT_TAG = "content";

/** Data cache lifetime: long in production (busted by tags on admin edits), short in dev. */
export const CACHE_SECONDS = process.env.NODE_ENV === "production" ? 3600 : 5;

const productInclude = {
  forms: {
    orderBy: { position: "asc" },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: { position: "asc" } },
    },
  },
  notes: { orderBy: { position: "asc" }, include: { note: true } },
} satisfies Prisma.ProductInclude;

type ProductWithForms = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

// ─── ratings ────────────────────────────────────────────────────────────────

const getRatingMap = unstable_cache(
  async (includeDemo: boolean) => {
    const rows = await db.review.groupBy({
      by: ["productId"],
      where: { status: "APPROVED", ...(includeDemo ? {} : { isPlaceholder: false }) },
      _avg: { rating: true },
      _count: { _all: true },
    });
    return Object.fromEntries(
      rows.map((r) => [r.productId, { avg: Math.round((r._avg.rating ?? 0) * 10) / 10, count: r._count._all }]),
    );
  },
  ["rating-map"],
  { tags: [REVIEWS_TAG], revalidate: CACHE_SECONDS },
);

export async function getRatings() {
  return getRatingMap(showDemoContent());
}

// ─── mapping ────────────────────────────────────────────────────────────────

function toCard(
  p: ProductWithForms,
  locale: string,
  ratings: Record<string, { avg: number; count: number }>,
): ProductCardData {
  const forms: CardForm[] = p.forms.map((f) => ({
    type: f.type as FormType,
    concentration: tr(locale, f.concentration, f.concentrationAr) || null,
    image: p.useBottleArt ? null : (f.images[0]?.url ?? null),
    hoverImage: p.useBottleArt ? (f.images[0]?.url ?? null) : (f.images[1]?.url ?? null),
    variants: f.variants.map((v) => ({
      id: v.id,
      label: v.label,
      sizeMl: v.sizeMl,
      price: v.price,
      mrp: v.mrp,
      stock: v.stock,
      isDefault: v.isDefault,
    })),
  }));
  const allVariants = forms.flatMap((f) => f.variants);
  return {
    id: p.id,
    slug: p.slug,
    name: tr(locale, p.name, p.nameAr),
    tagline: tr(locale, p.tagline, p.taglineAr),
    kind: p.kind as ProductKind,
    family: p.family,
    gender: p.gender,
    accentColor: p.accentColor,
    bottleShape: p.bottleShape,
    useBottleArt: p.useBottleArt,
    isNew: p.isNew,
    isBestseller: p.isBestseller,
    isFeatured: p.isFeatured,
    isSampleable: p.isSampleable,
    rating: ratings[p.id] ?? { avg: 0, count: 0 },
    forms,
    moods: p.moods,
    needs: p.therapyNeeds,
    notes: p.notes.map((n) => n.note.slug),
    minPrice: allVariants.length ? Math.min(...allVariants.map((v) => v.price)) : 0,
    onSale: allVariants.some((v) => v.mrp && v.mrp > v.price),
    position: p.position,
    createdAt: p.createdAt.toISOString(),
  };
}

const getActiveProducts = unstable_cache(
  async () =>
    db.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { position: "asc" },
      include: productInclude,
    }),
  ["active-products"],
  { tags: [CATALOG_TAG], revalidate: CACHE_SECONDS },
);

/** Every active product as card data. The catalogue is small, so filtering happens in memory. */
export async function getAllCards(locale: string): Promise<ProductCardData[]> {
  const [products, ratings] = await Promise.all([getActiveProducts(), getRatings()]);
  // unstable_cache serialises Dates to strings
  return products.map((p) =>
    toCard({ ...p, createdAt: new Date(p.createdAt) } as ProductWithForms, locale, ratings),
  );
}

// ─── filtering & sorting ────────────────────────────────────────────────────

const asArray = <T,>(v: T | T[] | undefined): T[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

export function filterCards(cards: ProductCardData[], f: CatalogFilter) {
  const kinds = asArray(f.kind);
  const forms = asArray(f.form);
  return cards.filter((c) => {
    if (c.kind === "DISCOVERY_SET") return false;
    if (kinds.length && !kinds.includes(c.kind)) return false;
    if (forms.length && !c.forms.some((x) => forms.includes(x.type))) return false;
    if (f.gender?.length && !f.gender.includes(c.gender)) return false;
    if (f.family?.length && (!c.family || !f.family.includes(c.family))) return false;
    if (f.mood?.length && !c.moods.some((m) => f.mood!.includes(m))) return false;
    if (f.need?.length && !c.needs.some((m) => f.need!.includes(m))) return false;
    if (f.isNew && !c.isNew) return false;
    if (f.isBestseller && !c.isBestseller) return false;
    if (f.onSale && !c.onSale) return false;
    if (f.minPrice !== undefined && c.minPrice < f.minPrice) return false;
    if (f.maxPrice !== undefined && c.minPrice > f.maxPrice) return false;
    if (f.ids?.length && !f.ids.includes(c.id)) return false;
    return true;
  });
}

export function sortCards(cards: ProductCardData[], sort: CatalogSort = "featured") {
  const copy = [...cards];
  switch (sort) {
    case "newest":
      return copy.sort((a, b) => Number(b.isNew) - Number(a.isNew) || b.createdAt.localeCompare(a.createdAt));
    case "price-asc":
      return copy.sort((a, b) => a.minPrice - b.minPrice);
    case "price-desc":
      return copy.sort((a, b) => b.minPrice - a.minPrice);
    case "rating":
      return copy.sort((a, b) => b.rating.avg - a.rating.avg || b.rating.count - a.rating.count);
    default:
      return copy.sort(
        (a, b) =>
          Number(b.isFeatured) - Number(a.isFeatured) ||
          Number(b.isBestseller) - Number(a.isBestseller) ||
          a.position - b.position,
      );
  }
}

/** Parse the JSON rule stored on a Collection into a CatalogFilter. */
export function collectionFilter(json: unknown): CatalogFilter | null {
  if (!json || typeof json !== "object") return null;
  return json as CatalogFilter;
}

// ─── collections ────────────────────────────────────────────────────────────

const getCollectionRows = unstable_cache(
  async () =>
    db.collection.findMany({
      orderBy: { position: "asc" },
      include: { products: { orderBy: { position: "asc" }, select: { productId: true } } },
    }),
  ["collections"],
  { tags: [CATALOG_TAG], revalidate: CACHE_SECONDS },
);

export type CollectionData = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  imageUrl: string | null;
  isFeatured: boolean;
  filter: CatalogFilter | null;
  productIds: string[];
};

function localizeCollection(c: Awaited<ReturnType<typeof getCollectionRows>>[number], locale: string): CollectionData {
  return {
    slug: c.slug,
    name: tr(locale, c.name, c.nameAr),
    tagline: tr(locale, c.tagline, c.taglineAr),
    description: tr(locale, c.description, c.descriptionAr),
    imageUrl: c.imageUrl,
    isFeatured: c.isFeatured,
    filter: collectionFilter(c.filter),
    productIds: c.products.map((p) => p.productId),
  };
}

export async function getCollections(locale: string) {
  const rows = await getCollectionRows();
  return rows.map((c) => localizeCollection(c, locale));
}

export async function getCollection(slug: string, locale: string) {
  const rows = await getCollectionRows();
  const row = rows.find((c) => c.slug === slug);
  return row ? localizeCollection(row, locale) : null;
}

/** Products in a collection — manual membership keeps its curated order. */
export function cardsForCollection(cards: ProductCardData[], c: CollectionData) {
  if (c.filter) return filterCards(cards, c.filter);
  const order = new Map(c.productIds.map((id, i) => [id, i]));
  return cards
    .filter((card) => order.has(card.id))
    .sort((a, b) => order.get(a.id)! - order.get(b.id)!);
}

// ─── product detail ─────────────────────────────────────────────────────────

const getProductRow = unstable_cache(
  async (slug: string) =>
    db.product.findUnique({
      where: { slug },
      include: {
        ...productInclude,
        pairsWith: { where: { status: "ACTIVE" }, select: { id: true } },
        collections: { include: { collection: { select: { slug: true, name: true, nameAr: true } } } },
      },
    }),
  ["product-detail"],
  { tags: [CATALOG_TAG], revalidate: CACHE_SECONDS },
);

export async function getProductDetail(slug: string, locale: string) {
  const row = await getProductRow(slug);
  if (!row || row.status !== "ACTIVE") return null;
  const product = { ...row, createdAt: new Date(row.createdAt) } as unknown as ProductWithForms & typeof row;
  const ratings = await getRatings();
  const card = toCard(product, locale, ratings);

  const notesByLayer = (layer: "TOP" | "HEART" | "BASE") =>
    row.notes
      .filter((n) => n.layer === layer)
      .map((n) => ({ slug: n.note.slug, name: tr(locale, n.note.name, n.note.nameAr) }));

  return {
    ...card,
    story: tr(locale, row.story, row.storyAr),
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    longevity: row.longevity,
    sillage: row.sillage,
    intensity: row.intensity,
    seasons: row.seasons,
    times: row.times,
    occasions: row.occasions,
    notesPyramid: { top: notesByLayer("TOP"), heart: notesByLayer("HEART"), base: notesByLayer("BASE") },
    formDetails: row.forms.map((f) => ({
      type: f.type as FormType,
      description: tr(locale, f.description, f.descriptionAr),
      howToUse: tr(locale, f.howToUse, f.howToUseAr),
      images: f.images.map((i) => ({ url: i.url, alt: tr(locale, i.alt, i.altAr) || card.name })),
    })),
    pairIds: row.pairsWith.map((p) => p.id),
    collections: row.collections.map((c) => ({
      slug: c.collection.slug,
      name: tr(locale, c.collection.name, c.collection.nameAr),
    })),
  };
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductDetail>>>;

export async function getProductReviews(productId: string) {
  const reviews = await db.review.findMany({
    where: {
      productId,
      status: "APPROVED",
      ...(showDemoContent() ? {} : { isPlaceholder: false }),
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  return { reviews, distribution };
}

export async function getProductSlugs() {
  const rows = await db.product.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true } });
  return rows;
}
