import "server-only";
import type { CollectionDraft } from "@/components/admin/collection-editor";
import { db } from "@/lib/db";
import type { CatalogFilter } from "@/lib/types";

const arr = (v: unknown) => (Array.isArray(v) ? v.map(String) : typeof v === "string" ? [v] : []);

export const emptyCollection: CollectionDraft = {
  name: "",
  nameAr: "",
  slug: "",
  tagline: "",
  taglineAr: "",
  description: "",
  descriptionAr: "",
  imageUrl: "",
  isFeatured: false,
  position: "50",
  mode: "manual",
  rule: { kind: [], form: [], gender: [], family: [], mood: [], need: [], isNew: false, isBestseller: false, onSale: false, minPrice: "", maxPrice: "" },
  productIds: [],
};

export async function loadCollectionDraft(id: string): Promise<CollectionDraft | null> {
  const c = await db.collection.findUnique({ where: { id }, include: { products: { orderBy: { position: "asc" }, select: { productId: true } } } });
  if (!c) return null;
  const f = (c.filter ?? null) as CatalogFilter | null;
  return {
    id: c.id,
    name: c.name,
    nameAr: c.nameAr ?? "",
    slug: c.slug,
    tagline: c.tagline ?? "",
    taglineAr: c.taglineAr ?? "",
    description: c.description ?? "",
    descriptionAr: c.descriptionAr ?? "",
    imageUrl: c.imageUrl ?? "",
    isFeatured: c.isFeatured,
    position: String(c.position),
    mode: f ? "rule" : "manual",
    rule: {
      kind: arr(f?.kind),
      form: arr(f?.form),
      gender: arr(f?.gender),
      family: arr(f?.family),
      mood: arr(f?.mood),
      need: arr(f?.need),
      isNew: !!f?.isNew,
      isBestseller: !!f?.isBestseller,
      onSale: !!f?.onSale,
      minPrice: f?.minPrice ? String(f.minPrice / 100) : "",
      maxPrice: f?.maxPrice ? String(f.maxPrice / 100) : "",
    },
    productIds: c.products.map((p) => p.productId),
  };
}

export async function loadProductOptions() {
  const rows = await db.product.findMany({
    where: { status: { not: "ARCHIVED" } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, status: true, forms: { orderBy: { position: "asc" }, take: 1, select: { images: { orderBy: { position: "asc" }, take: 1, select: { url: true } } } } },
  });
  return rows.map((p) => ({ id: p.id, name: p.name, status: p.status, image: p.forms[0]?.images[0]?.url ?? null }));
}
