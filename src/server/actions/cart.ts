"use server";

import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  buildCartView,
  currentCartView,
  ensureCart,
  findCart,
  MAX_LINE_QTY,
  mergeGuestCart,
  validateCoupon,
  validateDiscoverySelections,
  type CartView,
  type CouponError,
} from "../cart";
import { getSettings } from "../queries/content";
import { getSessionUser } from "../session";

type Result = { ok: true; cart: CartView } | { ok: false; error: string; cart?: CartView };

const locale = z.string().transform((l): "en" | "ar" => (l === "ar" ? "ar" : "en"));

export async function getCart(loc: string): Promise<CartView> {
  return currentCartView(locale.parse(loc));
}

const addSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(MAX_LINE_QTY).default(1),
  selections: z
    .array(z.object({ productId: z.string(), form: z.enum(["PERFUME", "ATTAR", "OIL", "SET"]) }))
    .optional(),
  locale,
});

export async function addToCart(input: z.input<typeof addSchema>): Promise<Result> {
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID" };
  const { variantId, quantity, selections, locale: loc } = parsed.data;

  const variant = await db.variant.findUnique({
    where: { id: variantId },
    include: { form: { include: { product: { select: { status: true, kind: true } } } } },
  });
  if (!variant || variant.form.product.status !== "ACTIVE") return { ok: false, error: "NOT_FOUND" };
  if (variant.stock <= 0) return { ok: false, error: "OUT_OF_STOCK" };

  let validSelections: Prisma.InputJsonValue | undefined;
  if (variant.form.product.kind === "DISCOVERY_SET") {
    const { commerce } = await getSettings();
    const picks = await validateDiscoverySelections(selections, commerce.discoverySetSize);
    if (!picks) return { ok: false, error: "INVALID_SELECTION" };
    validSelections = picks;
  }

  const cartId = await ensureCart();

  if (validSelections) {
    await db.cartItem.create({ data: { cartId, variantId, quantity: 1, selections: validSelections } });
  } else {
    const sameVariant = await db.cartItem.findMany({ where: { cartId, variantId } });
    const existingPlain = sameVariant.find((i) => i.selections === null);
    if (existingPlain) {
      await db.cartItem.update({
        where: { id: existingPlain.id },
        data: { quantity: Math.min(MAX_LINE_QTY, variant.stock, existingPlain.quantity + quantity) },
      });
    } else {
      await db.cartItem.create({
        data: { cartId, variantId, quantity: Math.min(quantity, variant.stock, MAX_LINE_QTY) },
      });
    }
  }
  return { ok: true, cart: await currentCartView(loc) };
}

export async function updateCartItem(input: { itemId: string; quantity: number; locale: string }): Promise<Result> {
  const loc = locale.parse(input.locale);
  const cart = await findCart();
  const item = cart?.items.find((i) => i.id === input.itemId);
  if (!cart || !item) return { ok: false, error: "NOT_FOUND" };
  const qty = Math.floor(input.quantity);
  if (qty <= 0) {
    await db.cartItem.delete({ where: { id: item.id } });
  } else {
    await db.cartItem.update({
      where: { id: item.id },
      data: { quantity: Math.min(qty, MAX_LINE_QTY, Math.max(1, item.variant.stock)) },
    });
  }
  return { ok: true, cart: await currentCartView(loc) };
}

export async function removeCartItem(input: { itemId: string; locale: string }): Promise<Result> {
  return updateCartItem({ ...input, quantity: 0 });
}

const COUPON_ERRORS: CouponError[] = ["NOT_FOUND", "EXPIRED", "NOT_STARTED", "USAGE_LIMIT", "FIRST_ORDER_ONLY", "LOGIN_REQUIRED"];

export async function applyCoupon(input: { code: string; locale: string }): Promise<Result> {
  const loc = locale.parse(input.locale);
  const code = input.code.trim().toUpperCase().slice(0, 40);
  if (!code) return { ok: false, error: "NOT_FOUND" };
  const user = await getSessionUser();
  const res = await validateCoupon(code, user?.id);
  if (!res.ok) return { ok: false, error: COUPON_ERRORS.includes(res.error) ? res.error : "NOT_FOUND" };
  const cartId = await ensureCart();
  await db.cart.update({ where: { id: cartId }, data: { couponCode: res.coupon.code } });
  const cart = await currentCartView(loc);
  if (cart.totals.couponError === "MIN_SUBTOTAL") return { ok: false, error: "MIN_SUBTOTAL", cart };
  return { ok: true, cart };
}

export async function removeCoupon(loc: string): Promise<Result> {
  const cart = await findCart();
  if (cart) await db.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
  return { ok: true, cart: await currentCartView(locale.parse(loc)) };
}

export async function setGiftOptions(input: { giftWrap: boolean; giftMessage?: string; locale: string }): Promise<Result> {
  const cartId = await ensureCart();
  await db.cart.update({
    where: { id: cartId },
    data: { giftWrap: input.giftWrap, giftMessage: input.giftMessage?.slice(0, 240) || null },
  });
  return { ok: true, cart: await currentCartView(locale.parse(input.locale)) };
}

export async function setFreeSample(input: { productId: string | null; locale: string }): Promise<Result> {
  const cartId = await ensureCart();
  if (input.productId) {
    const ok = await db.product.findFirst({ where: { id: input.productId, isSampleable: true, status: "ACTIVE" } });
    if (!ok) return { ok: false, error: "INVALID" };
  }
  await db.cart.update({ where: { id: cartId }, data: { freeSampleProductId: input.productId } });
  return { ok: true, cart: await currentCartView(locale.parse(input.locale)) };
}

/** Called by the client right after sign-in. */
export async function mergeCartAfterSignIn(loc: string): Promise<CartView> {
  const user = await getSessionUser();
  if (user) await mergeGuestCart(user.id);
  return buildCartView(await findCart(), locale.parse(loc));
}
