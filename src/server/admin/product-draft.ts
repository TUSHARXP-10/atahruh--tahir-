import "server-only";
import type { FormDraft, ProductDraft } from "@/components/admin/product-draft-shared";
import { db } from "@/lib/db";

const rupeesText = (paise: number | null | undefined) => (paise ? String(paise / 100) : "");

/** Load a product into the editor's draft shape (prices in rupees, text fields as strings). */
export async function loadProductDraft(id: string): Promise<ProductDraft | null> {
  const p = await db.product.findUnique({
    where: { id },
    include: {
      forms: { orderBy: { position: "asc" }, include: { images: { orderBy: { position: "asc" } }, variants: { orderBy: { position: "asc" } } } },
      notes: { orderBy: { position: "asc" }, include: { note: { select: { name: true } } } },
      collections: { select: { collectionId: true } },
      pairsWith: { select: { id: true } },
    },
  });
  if (!p) return null;
  const notes = (layer: string) => p.notes.filter((n) => n.layer === layer).map((n) => n.note.name);
  return {
    id: p.id,
    name: p.name,
    nameAr: p.nameAr ?? "",
    slug: p.slug,
    kind: p.kind,
    status: p.status,
    tagline: p.tagline ?? "",
    taglineAr: p.taglineAr ?? "",
    story: p.story ?? "",
    storyAr: p.storyAr ?? "",
    family: p.family ?? "",
    gender: p.gender,
    moods: p.moods,
    therapyNeeds: p.therapyNeeds,
    seasons: p.seasons,
    times: p.times,
    occasions: p.occasions,
    longevity: p.longevity,
    sillage: p.sillage,
    intensity: p.intensity,
    accentColor: p.accentColor,
    bottleShape: (["facet", "round", "column", "arch"].includes(p.bottleShape) ? p.bottleShape : "facet") as ProductDraft["bottleShape"],
    isBestseller: p.isBestseller,
    isNew: p.isNew,
    isFeatured: p.isFeatured,
    isSampleable: p.isSampleable,
    useBottleArt: p.useBottleArt,
    position: String(p.position),
    seoTitle: p.seoTitle ?? "",
    seoDescription: p.seoDescription ?? "",
    notes: { top: notes("TOP"), heart: notes("HEART"), base: notes("BASE") },
    collectionIds: p.collections.map((c) => c.collectionId),
    pairIds: p.pairsWith.map((x) => x.id),
    forms: p.forms.map(
      (f): FormDraft => ({
        key: f.id,
        id: f.id,
        type: f.type,
        concentration: f.concentration ?? "",
        concentrationAr: f.concentrationAr ?? "",
        description: f.description ?? "",
        descriptionAr: f.descriptionAr ?? "",
        howToUse: f.howToUse ?? "",
        howToUseAr: f.howToUseAr ?? "",
        images: f.images.map((i) => ({ url: i.url, alt: i.alt ?? "" })),
        variants: f.variants.map((v) => ({
          key: v.id,
          id: v.id,
          label: v.label,
          sizeMl: String(v.sizeMl),
          price: rupeesText(v.price),
          mrp: rupeesText(v.mrp),
          sku: v.sku,
          stock: String(v.stock),
          isDefault: v.isDefault,
        })),
      }),
    ),
  };
}

/** Lists the editor needs for its pickers. */
export async function loadEditorOptions() {
  const [collections, products, notes] = await Promise.all([
    db.collection.findMany({ orderBy: { position: "asc" }, select: { id: true, name: true } }),
    db.product.findMany({ where: { status: { not: "ARCHIVED" } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.note.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
  ]);
  return { collections, products, noteNames: notes.map((n) => n.name) };
}
