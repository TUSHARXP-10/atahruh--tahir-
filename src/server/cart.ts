import "server-only";
import { cookies } from "next/headers";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { computeTotals, type CouponRule, type PricingResult } from "@/lib/pricing";
import type { FormType } from "@/lib/types";
import { tr } from "@/lib/utils";
import { getSettings } from "./queries/content";
import { getSessionUser } from "./session";

export const CART_COOKIE = "aar_cart";
export const MAX_LINE_QTY = 10;

const cartInclude = {
  items: {
    orderBy: { createdAt: "asc" },
    include: {
      variant: {
        include: {
          form: {
            include: {
              images: { orderBy: { position: "asc" }, take: 1 },
              product: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                  nameAr: true,
                  kind: true,
                  accentColor: true,
                  bottleShape: true,
                  useBottleArt: true,
                  status: true,
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

type CartRow = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

export type DiscoverySelection = { productId: string; form: FormType };

export type CartLine = {
  id: string;
  variantId: string;
  quantity: number;
  productId: string;
  slug: string;
  name: string;
  kind: string;
  formType: FormType;
  sizeLabel: string;
  unitPrice: number;
  mrp: number | null;
  stock: number;
  accentColor: string;
  bottleShape: string;
  image: string | null;
  selections: { productId: string; name: string; form: FormType; color: string }[] | null;
};

export type CartView = {
  id: string | null;
  lines: CartLine[];
  couponCode: string | null;
  coupon: CouponRule | null;
  giftWrap: boolean;
  giftMessage: string | null;
  freeSampleProductId: string | null;
  /** Current gift-wrap price (from Admin → Settings) */
  giftWrapFee: number;
  totals: PricingResult;
};

// ─── cart lookup ────────────────────────────────────────────────────────────

/** Resolve the current cart: the signed-in user's cart, otherwise the cookie cart. */
export async function findCart(): Promise<CartRow | null> {
  const user = await getSessionUser();
  if (user) {
    const owned = await db.cart.findUnique({ where: { userId: user.id }, include: cartInclude });
    if (owned) return owned;
  }
  const id = (await cookies()).get(CART_COOKIE)?.value;
  if (!id) return null;
  const cart = await db.cart.findUnique({ where: { id }, include: cartInclude });
  // A cookie cart that belongs to someone else is never used
  if (cart?.userId && cart.userId !== user?.id) return null;
  return cart;
}

/** Find or create the cart (server actions only — may set a cookie). */
export async function ensureCart(): Promise<string> {
  const existing = await findCart();
  if (existing) return existing.id;
  const user = await getSessionUser();
  const cart = await db.cart.create({ data: { userId: user?.id ?? null } });
  (await cookies()).set(CART_COOKIE, cart.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  });
  return cart.id;
}

// ─── coupons ────────────────────────────────────────────────────────────────

export type CouponError = "NOT_FOUND" | "EXPIRED" | "NOT_STARTED" | "USAGE_LIMIT" | "FIRST_ORDER_ONLY" | "LOGIN_REQUIRED";

export async function validateCoupon(
  code: string,
  userId?: string | null,
): Promise<{ ok: true; coupon: CouponRule } | { ok: false; error: CouponError }> {
  const c = await db.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!c || !c.active) return { ok: false, error: "NOT_FOUND" };
  const now = new Date();
  if (c.startsAt && c.startsAt > now) return { ok: false, error: "NOT_STARTED" };
  if (c.endsAt && c.endsAt < now) return { ok: false, error: "EXPIRED" };
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) return { ok: false, error: "USAGE_LIMIT" };
  if (c.firstOrderOnly) {
    if (!userId) return { ok: false, error: "LOGIN_REQUIRED" };
    const orders = await db.order.count({ where: { userId, paymentStatus: { in: ["PAID", "PENDING"] }, status: { not: "CANCELLED" } } });
    if (orders > 0) return { ok: false, error: "FIRST_ORDER_ONLY" };
  }
  if (c.perUserLimit != null && userId) {
    const used = await db.order.count({ where: { userId, couponCode: c.code, status: { not: "CANCELLED" } } });
    if (used >= c.perUserLimit) return { ok: false, error: "USAGE_LIMIT" };
  }
  return {
    ok: true,
    coupon: { code: c.code, type: c.type, value: c.value, minSubtotal: c.minSubtotal, maxDiscount: c.maxDiscount },
  };
}

// ─── discovery set ──────────────────────────────────────────────────────────

export async function validateDiscoverySelections(raw: unknown, size: number) {
  if (!Array.isArray(raw) || raw.length !== size) return null;
  const picks = raw as DiscoverySelection[];
  const ids = picks.map((p) => p.productId);
  if (new Set(ids).size !== ids.length) return null;
  const products = await db.product.findMany({
    where: { id: { in: ids }, status: "ACTIVE", isSampleable: true, kind: "FRAGRANCE" },
    select: { id: true, forms: { select: { type: true } } },
  });
  if (products.length !== size) return null;
  for (const pick of picks) {
    const p = products.find((x) => x.id === pick.productId);
    if (!p || !p.forms.some((f) => f.type === pick.form)) return null;
  }
  return picks.map((p) => ({ productId: p.productId, form: p.form }));
}

// ─── view ───────────────────────────────────────────────────────────────────

export async function buildCartView(
  cart: CartRow | null,
  locale: string,
  opts: { paymentMethod?: "ONLINE" | "COD"; deliverySpeed?: "standard" | "express" } = {},
): Promise<CartView> {
  const { commerce } = await getSettings();
  if (!cart) {
    return {
      id: null,
      lines: [],
      couponCode: null,
      coupon: null,
      giftWrap: false,
      giftMessage: null,
      freeSampleProductId: null,
      giftWrapFee: commerce.giftWrapFee,
      totals: computeTotals({ lines: [], settings: commerce }),
    };
  }

  const live = cart.items.filter((i) => i.variant.form.product.status === "ACTIVE");

  // Resolve discovery set picks to names/colours in one query
  const pickIds = live.flatMap((i) => (Array.isArray(i.selections) ? (i.selections as DiscoverySelection[]).map((s) => s.productId) : []));
  const pickProducts = pickIds.length
    ? await db.product.findMany({ where: { id: { in: pickIds } }, select: { id: true, name: true, nameAr: true, accentColor: true } })
    : [];

  const lines: CartLine[] = live.map((i) => {
    const v = i.variant;
    const p = v.form.product;
    const selections = Array.isArray(i.selections)
      ? (i.selections as DiscoverySelection[]).map((s) => {
          const pp = pickProducts.find((x) => x.id === s.productId);
          return { productId: s.productId, form: s.form, name: pp ? tr(locale, pp.name, pp.nameAr) : "—", color: pp?.accentColor ?? "#c9a55c" };
        })
      : null;
    return {
      id: i.id,
      variantId: v.id,
      quantity: i.quantity,
      productId: p.id,
      slug: p.slug,
      name: tr(locale, p.name, p.nameAr),
      kind: p.kind,
      formType: v.form.type as FormType,
      sizeLabel: v.label,
      unitPrice: v.price,
      mrp: v.mrp,
      stock: v.stock,
      accentColor: p.accentColor,
      bottleShape: p.bottleShape,
      image: p.useBottleArt ? null : (v.form.images[0]?.url ?? null),
      selections,
    };
  });

  let coupon: CouponRule | null = null;
  if (cart.couponCode) {
    const user = await getSessionUser();
    const res = await validateCoupon(cart.couponCode, user?.id);
    if (res.ok) coupon = res.coupon;
  }

  return {
    id: cart.id,
    lines,
    couponCode: coupon ? cart.couponCode : null,
    coupon,
    giftWrap: cart.giftWrap,
    giftMessage: cart.giftMessage,
    freeSampleProductId: cart.freeSampleProductId,
    giftWrapFee: commerce.giftWrapFee,
    totals: computeTotals({
      lines: lines.map((l) => ({ unitPrice: l.unitPrice, quantity: l.quantity })),
      coupon,
      giftWrap: cart.giftWrap,
      paymentMethod: opts.paymentMethod,
      deliverySpeed: opts.deliverySpeed,
      settings: commerce,
    }),
  };
}

export async function currentCartView(locale: string) {
  return buildCartView(await findCart(), locale);
}

/** Move a guest cookie cart into the user's cart after sign-in. */
export async function mergeGuestCart(userId: string) {
  const id = (await cookies()).get(CART_COOKIE)?.value;
  if (!id) return;
  const guest = await db.cart.findUnique({ where: { id }, include: { items: true } });
  if (!guest || guest.userId === userId) return;
  if (guest.userId) return;
  const owned = await db.cart.findUnique({ where: { userId }, include: { items: true } });
  if (!owned) {
    await db.cart.update({ where: { id: guest.id }, data: { userId } });
    return;
  }
  for (const item of guest.items) {
    const match = owned.items.find((o) => o.variantId === item.variantId && !o.selections && !item.selections);
    if (match) {
      await db.cartItem.update({
        where: { id: match.id },
        data: { quantity: Math.min(MAX_LINE_QTY, match.quantity + item.quantity) },
      });
    } else {
      await db.cartItem.update({ where: { id: item.id }, data: { cartId: owned.id } });
    }
  }
  await db.cart.delete({ where: { id: guest.id } });
  (await cookies()).set(CART_COOKIE, owned.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 60 });
}
