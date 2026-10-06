"use server";

import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireAdminAction } from "../auth";
import { refreshStorefront } from "../refresh";
import { done, fail, invalid, uniqueViolation, type ActionResult } from "../result";

const text = (max: number) => z.string().trim().max(max).optional().default("");
const list = <T extends readonly [string, ...string[]]>(v: T) => z.array(z.enum(v)).default([]);

const ruleSchema = z.object({
  kind: list(["FRAGRANCE", "THERAPY", "GIFT_SET", "DISCOVERY_SET"] as const),
  form: list(["PERFUME", "ATTAR", "OIL", "SET"] as const),
  gender: list(["MEN", "WOMEN", "UNISEX"] as const),
  family: list(["OUD", "FLORAL", "WOODY", "AMBER", "MUSK", "CITRUS", "FRESH", "SPICY", "GOURMAND", "EARTHY", "HERBAL"] as const),
  mood: list(["CALM", "ENERGETIC", "CONFIDENT", "FOCUSED", "ROMANTIC", "BALANCED"] as const),
  need: list(["STRESS", "SLEEP", "FOCUS", "SKIN_HAIR", "BALANCE"] as const),
  isNew: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  onSale: z.boolean().default(false),
  minPrice: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
  maxPrice: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
});

const schema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Name is required").max(80),
  nameAr: text(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Web address: lowercase letters, numbers and dashes only"),
  tagline: text(120),
  taglineAr: text(120),
  description: text(2000),
  descriptionAr: text(2000),
  imageUrl: text(500),
  isFeatured: z.boolean(),
  position: z.coerce.number().int().min(0).max(10_000),
  mode: z.enum(["rule", "manual"]),
  rule: ruleSchema,
  productIds: z.array(z.string()).max(300).default([]),
});

export type CollectionPayload = z.input<typeof schema>;

/** Store only the parts of the rule that are set (the storefront treats a missing key as "any"). */
function compactRule(r: z.infer<typeof ruleSchema>) {
  const out: Record<string, unknown> = {};
  for (const k of ["kind", "form", "gender", "family", "mood", "need"] as const) if (r[k].length) out[k] = r[k];
  if (r.isNew) out.isNew = true;
  if (r.isBestseller) out.isBestseller = true;
  if (r.onSale) out.onSale = true;
  if (typeof r.minPrice === "number" && r.minPrice > 0) out.minPrice = Math.round(r.minPrice * 100);
  if (typeof r.maxPrice === "number" && r.maxPrice > 0) out.maxPrice = Math.round(r.maxPrice * 100);
  return out;
}

export async function saveCollection(payload: CollectionPayload): Promise<ActionResult> {
  await requireAdminAction();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return invalid(parsed.error);
  const c = parsed.data;
  const rule = compactRule(c.rule);
  if (c.mode === "rule" && !Object.keys(rule).length) return fail("Choose at least one rule, or switch to hand-picked products.");
  if (c.mode === "manual" && !c.productIds.length) return fail("Pick at least one product, or switch to an automatic rule.");

  const data = {
    name: c.name,
    nameAr: c.nameAr || null,
    slug: c.slug,
    tagline: c.tagline || null,
    taglineAr: c.taglineAr || null,
    description: c.description || null,
    descriptionAr: c.descriptionAr || null,
    imageUrl: c.imageUrl || null,
    isFeatured: c.isFeatured,
    position: c.position,
    // Rule-based collections store their rule; hand-picked ones clear it
    filter: c.mode === "rule" ? (rule as Prisma.InputJsonValue) : Prisma.DbNull,
  };

  let id = c.id ?? "";
  try {
    await db.$transaction(async (tx) => {
      const row = c.id
        ? await tx.collection.update({ where: { id: c.id }, data })
        : await tx.collection.create({ data });
      id = row.id;
      await tx.collectionProduct.deleteMany({ where: { collectionId: id } });
      if (c.mode === "manual") {
        await tx.collectionProduct.createMany({ data: [...new Set(c.productIds)].map((productId, position) => ({ collectionId: id, productId, position })) });
      }
    });
  } catch (e) {
    const dup = uniqueViolation(e, "web address");
    if (dup) return dup;
    console.error("[admin] saveCollection", e);
    return fail("Could not save the collection.");
  }
  refreshStorefront("catalog");
  return done("Collection saved", c.id ? undefined : { redirect: `/admin/collections/${id}` });
}

export async function deleteCollection(id: string): Promise<ActionResult> {
  await requireAdminAction();
  await db.collection.delete({ where: { id: String(id) } });
  refreshStorefront("catalog");
  return done("Collection deleted", { redirect: "/admin/collections" });
}
