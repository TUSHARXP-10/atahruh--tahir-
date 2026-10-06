"use server";

import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { requireAdminAction } from "../auth";
import { refreshStorefront } from "../refresh";
import { done, fail, invalid, uniqueViolation, type ActionResult } from "../result";
import { notifyBackInStock } from "../stock";

const text = (max: number) => z.string().trim().max(max).optional().default("");
const rupees = z.coerce.number({ message: "Enter a price" }).finite().min(0, "Price can’t be negative").max(10_000_000);
const imageUrl = z.string().trim().min(1).max(500).refine((u) => u.startsWith("/") || /^https:\/\//.test(u), "Images must be uploaded or picked from the library");

const variantSchema = z.object({
  id: z.string().optional(),
  label: z.string().trim().min(1, "Size label is required (e.g. 50 ml)").max(40),
  sizeMl: z.coerce.number().min(0).max(5000),
  price: rupees.refine((v) => v > 0, "Price must be more than ₹0"),
  mrp: z.union([rupees, z.literal(""), z.null()]).optional(),
  sku: z.string().trim().min(1, "SKU is required").max(60).regex(/^[A-Za-z0-9._-]+$/, "SKU: letters, numbers, dot, dash or underscore only"),
  stock: z.coerce.number().int("Stock must be a whole number").min(0).max(1_000_000),
  isDefault: z.boolean(),
});

const formSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["PERFUME", "ATTAR", "OIL", "SET"]),
  concentration: text(80),
  concentrationAr: text(80),
  description: text(4000),
  descriptionAr: text(4000),
  howToUse: text(2000),
  howToUseAr: text(2000),
  images: z.array(z.object({ url: imageUrl, alt: text(200) })).max(20),
  variants: z.array(variantSchema).min(1, "Add at least one size"),
});

const enumList = <T extends readonly [string, ...string[]]>(values: T) => z.array(z.enum(values)).default([]);

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Name is required").max(120),
  nameAr: text(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Web address: lowercase letters, numbers and dashes only"),
  kind: z.enum(["FRAGRANCE", "THERAPY", "GIFT_SET", "DISCOVERY_SET"]),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  tagline: text(160),
  taglineAr: text(160),
  story: text(6000),
  storyAr: text(6000),
  family: z.enum(["OUD", "FLORAL", "WOODY", "AMBER", "MUSK", "CITRUS", "FRESH", "SPICY", "GOURMAND", "EARTHY", "HERBAL"]).nullable(),
  gender: z.enum(["MEN", "WOMEN", "UNISEX"]),
  moods: enumList(["CALM", "ENERGETIC", "CONFIDENT", "FOCUSED", "ROMANTIC", "BALANCED"] as const),
  therapyNeeds: enumList(["STRESS", "SLEEP", "FOCUS", "SKIN_HAIR", "BALANCE"] as const),
  seasons: enumList(["SPRING", "SUMMER", "MONSOON", "AUTUMN", "WINTER"] as const),
  times: enumList(["DAY", "NIGHT"] as const),
  occasions: enumList(["EVERYDAY", "OFFICE", "DATE", "CELEBRATION", "PRAYER", "TRAVEL"] as const),
  longevity: z.coerce.number().int().min(1).max(5),
  sillage: z.coerce.number().int().min(1).max(5),
  intensity: z.coerce.number().int().min(1).max(5),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Colour must be a hex value like #C9A55C"),
  bottleShape: z.enum(["facet", "round", "column", "arch"]),
  isBestseller: z.boolean(),
  isNew: z.boolean(),
  isFeatured: z.boolean(),
  isSampleable: z.boolean(),
  useBottleArt: z.boolean(),
  position: z.coerce.number().int().min(0).max(100_000),
  seoTitle: text(70),
  seoDescription: text(170),
  notes: z.object({ top: z.array(z.string().trim().min(1).max(40)).max(12), heart: z.array(z.string().trim().min(1).max(40)).max(12), base: z.array(z.string().trim().min(1).max(40)).max(12) }),
  collectionIds: z.array(z.string()).max(50).default([]),
  pairIds: z.array(z.string()).max(12).default([]),
  forms: z.array(formSchema).min(1, "Add at least one form (e.g. Perfume)"),
});

export type ProductPayload = z.input<typeof productSchema>;

const toPaise = (r: number) => Math.round(r * 100);

export async function saveProduct(payload: ProductPayload): Promise<ActionResult> {
  await requireAdminAction();
  const parsed = productSchema.safeParse(payload);
  if (!parsed.success) {
    // Name the form and size in plain words: "Perfume 50 ml: Price must be more than ₹0"
    const issue = parsed.error.issues[0];
    const [, fi, , vi] = issue.path;
    if (issue.path[0] === "forms" && typeof fi === "number") {
      const form = payload.forms?.[fi];
      const variant = typeof vi === "number" ? form?.variants?.[vi] : undefined;
      const where = [form?.type ? form.type.charAt(0) + form.type.slice(1).toLowerCase() : "Form", variant?.label].filter(Boolean).join(" ");
      return fail(`${where}: ${issue.message}`);
    }
    return invalid(parsed.error);
  }
  const p = parsed.data;

  // Cross-field checks
  const types = p.forms.map((f) => f.type);
  if (new Set(types).size !== types.length) return fail("Each form (Perfume, Attar…) can only be added once.");
  const skus = p.forms.flatMap((f) => f.variants.map((v) => v.sku.toUpperCase()));
  const dupSku = skus.find((s, i) => skus.indexOf(s) !== i);
  if (dupSku) return fail(`SKU ${dupSku} is used twice — every size needs its own SKU.`);
  for (const f of p.forms) {
    for (const v of f.variants) {
      if (typeof v.mrp === "number" && v.mrp > 0 && v.mrp < v.price) return fail(`${f.type} ${v.label}: MRP must be at least the selling price.`);
    }
  }
  if (p.status === "ACTIVE" && p.useBottleArt === false && p.forms.some((f) => !f.images.length)) {
    return fail("Add at least one photo for every form before putting the product on sale (or turn on bottle artwork).");
  }

  const base = {
    name: p.name,
    nameAr: p.nameAr || null,
    slug: p.slug,
    kind: p.kind,
    status: p.status,
    tagline: p.tagline || null,
    taglineAr: p.taglineAr || null,
    story: p.story || null,
    storyAr: p.storyAr || null,
    family: p.family,
    gender: p.gender,
    moods: p.moods,
    therapyNeeds: p.therapyNeeds,
    seasons: p.seasons,
    times: p.times,
    occasions: p.occasions,
    longevity: p.longevity,
    sillage: p.sillage,
    intensity: p.intensity,
    accentColor: p.accentColor.toUpperCase(),
    bottleShape: p.bottleShape,
    isBestseller: p.isBestseller,
    isNew: p.isNew,
    isFeatured: p.isFeatured,
    isSampleable: p.isSampleable,
    useBottleArt: p.useBottleArt,
    position: p.position,
    seoTitle: p.seoTitle || null,
    seoDescription: p.seoDescription || null,
  } satisfies Prisma.ProductUncheckedUpdateInput;

  const restocked: string[] = [];
  let productId = p.id ?? "";
  try {
    await db.$transaction(
      async (tx) => {
        const product = p.id
          ? await tx.product.update({ where: { id: p.id }, data: { ...base, pairsWith: { set: p.pairIds.filter((x) => x !== p.id).map((id) => ({ id })) } } })
          : await tx.product.create({ data: { ...base, pairsWith: { connect: p.pairIds.map((id) => ({ id })) } } });
        productId = product.id;

        // Notes pyramid — reuse notes by slug, create new ones as typed
        await tx.productNote.deleteMany({ where: { productId } });
        const layers = [
          ["TOP", p.notes.top],
          ["HEART", p.notes.heart],
          ["BASE", p.notes.base],
        ] as const;
        for (const [layer, names] of layers) {
          for (const [position, name] of [...new Set(names)].entries()) {
            const slug = slugify(name);
            if (!slug) continue;
            const note = await tx.note.upsert({ where: { slug }, update: {}, create: { slug, name } });
            await tx.productNote.create({ data: { productId, noteId: note.id, layer, position } });
          }
        }

        // Collections — keep existing positions, append new memberships at the end
        await tx.collectionProduct.deleteMany({ where: { productId, collectionId: { notIn: p.collectionIds } } });
        const current = await tx.collectionProduct.findMany({ where: { productId }, select: { collectionId: true } });
        for (const collectionId of p.collectionIds.filter((c) => !current.some((x) => x.collectionId === c))) {
          const last = await tx.collectionProduct.aggregate({ where: { collectionId }, _max: { position: true } });
          await tx.collectionProduct.create({ data: { collectionId, productId, position: (last._max.position ?? -1) + 1 } });
        }

        // Forms → images and variants
        await tx.productForm.deleteMany({ where: { productId, type: { notIn: types } } });
        for (const [position, f] of p.forms.entries()) {
          const copy = {
            concentration: f.concentration || null,
            concentrationAr: f.concentrationAr || null,
            description: f.description || null,
            descriptionAr: f.descriptionAr || null,
            howToUse: f.howToUse || null,
            howToUseAr: f.howToUseAr || null,
            position,
          };
          const form = await tx.productForm.upsert({
            where: { productId_type: { productId, type: f.type } },
            update: copy,
            create: { productId, type: f.type, ...copy },
          });

          await tx.productImage.deleteMany({ where: { formId: form.id } });
          if (f.images.length) {
            await tx.productImage.createMany({ data: f.images.map((img, i) => ({ formId: form.id, url: img.url, alt: img.alt || null, position: i })) });
          }

          const existing = await tx.variant.findMany({ where: { formId: form.id }, select: { id: true, stock: true } });
          const keep = f.variants.map((v) => v.id).filter((id): id is string => !!id && existing.some((e) => e.id === id));
          await tx.variant.deleteMany({ where: { formId: form.id, id: { notIn: keep } } });
          const defaultIndex = Math.max(0, f.variants.findIndex((v) => v.isDefault));
          for (const [i, v] of f.variants.entries()) {
            const data = {
              label: v.label,
              sizeMl: v.sizeMl,
              price: toPaise(v.price),
              mrp: typeof v.mrp === "number" && v.mrp > 0 ? toPaise(v.mrp) : null,
              sku: v.sku.toUpperCase(),
              stock: v.stock,
              isDefault: i === defaultIndex,
              position: i,
            };
            const before = v.id ? existing.find((e) => e.id === v.id) : undefined;
            if (before) {
              await tx.variant.update({ where: { id: before.id }, data });
              if (before.stock === 0 && v.stock > 0) restocked.push(before.id);
            } else {
              await tx.variant.create({ data: { ...data, formId: form.id } });
            }
          }
        }
      },
      { timeout: 30_000 },
    );
  } catch (e) {
    const dup = uniqueViolation(e, "web address or SKU");
    if (dup) return dup;
    console.error("[admin] saveProduct", e);
    return fail("Could not save the product. Please try again.");
  }

  refreshStorefront("catalog");
  const emailed = await notifyBackInStock(restocked);
  const msg = emailed ? `Saved — ${emailed} waiting customer${emailed === 1 ? "" : "s"} emailed` : "Product saved";
  return done(msg, p.id ? { data: { id: productId } } : { redirect: `/admin/products/${productId}`, data: { id: productId } });
}

export async function setProductStatus(id: string, status: "ACTIVE" | "DRAFT" | "ARCHIVED"): Promise<ActionResult> {
  await requireAdminAction();
  const s = z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]).safeParse(status);
  if (!s.success) return fail("Unknown status");
  await db.product.update({ where: { id: String(id) }, data: { status: s.data } });
  refreshStorefront("catalog");
  return done(s.data === "ACTIVE" ? "Product is live" : s.data === "DRAFT" ? "Moved to drafts" : "Product archived");
}

/** Copy a product (as a hidden draft) — handy for adding a similar scent. */
export async function duplicateProduct(id: string): Promise<ActionResult> {
  await requireAdminAction();
  const src = await db.product.findUnique({
    where: { id: String(id) },
    include: { forms: { include: { images: true, variants: true } }, notes: true, collections: true },
  });
  if (!src) return fail("Product not found");
  let slug = `${src.slug}-copy`;
  for (let n = 2; await db.product.findUnique({ where: { slug }, select: { id: true } }); n++) slug = `${src.slug}-copy-${n}`;
  const suffix = slug.slice(src.slug.length).toUpperCase().replace(/[^A-Z0-9]/g, "");

  const { id: _id, createdAt: _c, updatedAt: _u, forms, notes, collections, ...rest } = src;
  const copy = await db.product.create({
    data: {
      ...rest,
      slug,
      name: `${src.name} (copy)`,
      status: "DRAFT",
      notes: { create: notes.map(({ noteId, layer, position }) => ({ noteId, layer, position })) },
      collections: { create: collections.map(({ collectionId, position }) => ({ collectionId, position })) },
      forms: {
        create: forms.map(({ id: _f, productId: _p, images, variants, ...f }) => ({
          ...f,
          images: { create: images.map(({ url, alt, altAr, position }) => ({ url, alt, altAr, position })) },
          variants: { create: variants.map(({ id: _v, formId: _fi, sku, ...v }) => ({ ...v, sku: `${sku}-${suffix}`.slice(0, 60), stock: 0 })) },
        })),
      },
    },
  });
  refreshStorefront("catalog");
  return done("Copy created as a draft", { redirect: `/admin/products/${copy.id}` });
}

/** Delete only products that were never ordered — otherwise archive keeps order history intact. */
export async function deleteProduct(id: string): Promise<ActionResult> {
  await requireAdminAction();
  const pid = String(id);
  const ordered = await db.orderItem.count({ where: { productId: pid } });
  if (ordered) {
    await db.product.update({ where: { id: pid }, data: { status: "ARCHIVED" } });
    refreshStorefront("catalog");
    return done("This product has orders, so it was archived instead of deleted", { redirect: "/admin/products" });
  }
  await db.product.delete({ where: { id: pid } });
  refreshStorefront("catalog");
  return done("Product deleted", { redirect: "/admin/products" });
}
