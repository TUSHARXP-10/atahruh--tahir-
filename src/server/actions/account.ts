"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { isValidPincode } from "@/lib/delivery";
import { getSessionUser } from "../session";

async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

const addressSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^(\+?91)?[\s-]?[6-9]\d{4}[\s-]?\d{5}$/),
  line1: z.string().trim().min(3).max(140),
  line2: z.string().trim().max(140).optional(),
  landmark: z.string().trim().max(80).optional(),
  city: z.string().trim().min(2).max(60),
  state: z.string().trim().min(2).max(60),
  pincode: z.string().trim().refine(isValidPincode),
  isDefault: z.boolean().optional(),
});

export async function saveAddress(input: z.input<typeof addressSchema>) {
  const user = await requireUser();
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, fields: parsed.error.issues.map((i) => i.path.join(".")) };
  const { id, isDefault, ...data } = parsed.data;
  const clean = { ...data, line2: data.line2 || null, landmark: data.landmark || null };

  if (isDefault) await db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
  if (id) {
    const own = await db.address.findFirst({ where: { id, userId: user.id } });
    if (!own) return { ok: false as const };
    await db.address.update({ where: { id }, data: { ...clean, ...(isDefault !== undefined ? { isDefault } : {}) } });
  } else {
    const count = await db.address.count({ where: { userId: user.id } });
    await db.address.create({ data: { ...clean, userId: user.id, isDefault: isDefault ?? count === 0 } });
  }
  revalidatePath("/[locale]/account/addresses", "page");
  return { ok: true as const };
}

export async function deleteAddress(id: string) {
  const user = await requireUser();
  await db.address.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/[locale]/account/addresses", "page");
  return { ok: true as const };
}

export async function setDefaultAddress(id: string) {
  const user = await requireUser();
  await db.$transaction([
    db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
    db.address.updateMany({ where: { id, userId: user.id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/[locale]/account/addresses", "page");
  return { ok: true as const };
}

export async function updateProfile(input: { name: string; phone?: string }) {
  const user = await requireUser();
  const parsed = z
    .object({ name: z.string().trim().min(2).max(80), phone: z.string().trim().max(20).optional() })
    .safeParse(input);
  if (!parsed.success) return { ok: false as const };
  await db.user.update({ where: { id: user.id }, data: { name: parsed.data.name, phone: parsed.data.phone || null } });
  revalidatePath("/[locale]/account", "layout");
  return { ok: true as const };
}

// ─── wishlist (signed-in users are persisted in the database) ───────────────

export async function syncWishlist(localIds: string[]) {
  const user = await getSessionUser();
  if (!user) return null;
  const ids = z.array(z.string().max(40)).max(200).catch([]).parse(localIds);
  if (ids.length) {
    const valid = await db.product.findMany({ where: { id: { in: ids } }, select: { id: true } });
    await db.wishlistItem.createMany({
      data: valid.map((p) => ({ userId: user.id, productId: p.id })),
      skipDuplicates: true,
    });
  }
  const rows = await db.wishlistItem.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, select: { productId: true } });
  return rows.map((r) => r.productId);
}

export async function setWishlisted(productId: string, wished: boolean) {
  const user = await getSessionUser();
  if (!user) return;
  if (wished) {
    await db.wishlistItem.upsert({
      where: { userId_productId: { userId: user.id, productId } },
      create: { userId: user.id, productId },
      update: {},
    });
  } else {
    await db.wishlistItem.deleteMany({ where: { userId: user.id, productId } });
  }
}
