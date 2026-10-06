"use server";

import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { estimateDelivery, isValidPincode } from "@/lib/delivery";
import { computeTotals } from "@/lib/pricing";
import { rateLimit } from "@/lib/rate-limit";
import { initiateTransaction, paytmEnabled, paytmMid, paytmScriptUrl } from "@/lib/paytm";
import { toPaytmAmount } from "@/lib/paytm-core";
import { site } from "@/lib/site";
import { findCart, validateCoupon, type DiscoverySelection } from "../cart";
import { commitStock, confirmCodOrder, generateOrderNumber, grantOrderAccess } from "../orders";
import { getSettings } from "../queries/content";
import { getSessionUser } from "../session";

const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(/^(\+?91)?[6-9]\d{9}$/));

const addressSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone,
  line1: z.string().trim().min(3).max(140),
  line2: z.string().trim().max(140).optional().default(""),
  landmark: z.string().trim().max(80).optional().default(""),
  city: z.string().trim().min(2).max(60),
  state: z.string().trim().min(2).max(60),
  pincode: z.string().trim().refine(isValidPincode),
});

const placeSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  address: addressSchema,
  saveAddress: z.boolean().optional(),
  deliverySpeed: z.enum(["standard", "express"]),
  paymentMethod: z.enum(["ONLINE", "COD"]),
  freeSampleProductId: z.string().nullable().optional(),
  locale: z.string().transform((l): "en" | "ar" => (l === "ar" ? "ar" : "en")),
});

export type PlaceOrderInput = z.input<typeof placeSchema>;

export type PlaceOrderResult =
  | { ok: true; number: string; mode: "cod" }
  | {
      ok: true;
      number: string;
      mode: "paytm";
      paytm: { mid: string; scriptUrl: string; orderId: string; txnToken: string; amount: string };
    }
  | { ok: false; error: "INVALID" | "EMPTY" | "OUT_OF_STOCK" | "COD_UNAVAILABLE" | "RATE_LIMIT" | "GENERIC"; fields?: string[] };

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const parsed = placeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "INVALID", fields: parsed.error.issues.map((i) => i.path.join(".")) };
  }
  if (!(await rateLimit("checkout", 12, 600))) return { ok: false, error: "RATE_LIMIT" };

  const data = parsed.data;
  const [cart, user, { commerce }] = await Promise.all([findCart(), getSessionUser(), getSettings()]);
  const lines = (cart?.items ?? []).filter((i) => i.variant.form.product.status === "ACTIVE");
  if (!cart || !lines.length) return { ok: false, error: "EMPTY" };

  // Stock check before anything is created
  if (lines.some((l) => l.variant.stock < l.quantity)) return { ok: false, error: "OUT_OF_STOCK" };

  // Delivery rules
  const est = estimateDelivery(data.address.pincode);
  const deliverySpeed = data.deliverySpeed === "express" && est.express ? "express" : "standard";

  // Coupon (re-validated server-side)
  let coupon = null;
  if (cart.couponCode) {
    const res = await validateCoupon(cart.couponCode, user?.id);
    if (res.ok) coupon = res.coupon;
  }

  const totals = computeTotals({
    lines: lines.map((l) => ({ unitPrice: l.variant.price, quantity: l.quantity })),
    coupon,
    giftWrap: cart.giftWrap,
    paymentMethod: data.paymentMethod,
    deliverySpeed,
    settings: commerce,
  });

  if (data.paymentMethod === "COD" && (!totals.codAllowed || !est.cod)) return { ok: false, error: "COD_UNAVAILABLE" };
  if (data.paymentMethod === "ONLINE" && !paytmEnabled()) return { ok: false, error: "GENERIC" };

  // Optional complimentary sample (only when the spend threshold is met)
  let sample: { id: string; name: string; slug: string; accentColor: string } | null = null;
  if (totals.freeSampleEligible && data.freeSampleProductId) {
    sample = await db.product.findFirst({
      where: { id: data.freeSampleProductId, isSampleable: true, status: "ACTIVE" },
      select: { id: true, name: true, slug: true, accentColor: true },
    });
  }

  // Resolve discovery-set picks for the order snapshot
  const pickIds = lines.flatMap((l) => (Array.isArray(l.selections) ? (l.selections as DiscoverySelection[]).map((s) => s.productId) : []));
  const picks = pickIds.length ? await db.product.findMany({ where: { id: { in: pickIds } }, select: { id: true, name: true } }) : [];

  const number = await generateOrderNumber();
  const addressJson = { ...data.address, country: "IN" } as Prisma.InputJsonValue;

  const items: Prisma.OrderItemUncheckedCreateWithoutOrderInput[] = lines.map((l) => ({
    variantId: l.variantId,
    productId: l.variant.form.product.id,
    productSlug: l.variant.form.product.slug,
    name: l.variant.form.product.name,
    formType: l.variant.form.type,
    sizeLabel: l.variant.label,
    accentColor: l.variant.form.product.accentColor,
    imageUrl: l.variant.form.images[0]?.url ?? null,
    unitPrice: l.variant.price,
    quantity: l.quantity,
    total: l.variant.price * l.quantity,
    selections: Array.isArray(l.selections)
      ? ((l.selections as DiscoverySelection[]).map((s) => ({ ...s, name: picks.find((p) => p.id === s.productId)?.name ?? "" })) as Prisma.InputJsonValue)
      : undefined,
  }));
  if (sample) {
    items.push({
      productId: sample.id,
      productSlug: sample.slug,
      name: `${sample.name} — complimentary sample`,
      formType: "PERFUME",
      sizeLabel: "2 ml",
      accentColor: sample.accentColor,
      unitPrice: 0,
      quantity: 1,
      total: 0,
    });
  }

  const order = await db.order.create({
    data: {
      number,
      userId: user?.id ?? null,
      email: data.email,
      phone: data.address.phone,
      locale: data.locale,
      paymentMethod: data.paymentMethod,
      ...(data.paymentMethod === "ONLINE" ? { paymentGateway: "paytm", gatewayOrderId: number } : {}),
      shippingAddress: addressJson,
      subtotal: totals.subtotal,
      discount: totals.discount,
      shippingFee: totals.shippingFee,
      codFee: totals.codFee,
      giftWrapFee: totals.giftWrapFee,
      total: totals.total,
      taxIncluded: totals.taxIncluded,
      couponCode: coupon?.code ?? null,
      giftWrap: cart.giftWrap,
      giftMessage: cart.giftMessage,
      deliverySpeed,
      cartId: cart.id,
      items: { create: items },
      events: { create: { message: "Order placed" } },
    },
  });

  if (user && data.saveAddress) {
    const count = await db.address.count({ where: { userId: user.id } });
    await db.address.create({
      data: { userId: user.id, ...data.address, line2: data.address.line2 || null, landmark: data.address.landmark || null, isDefault: count === 0 },
    });
  }
  if (user && !(user as { phone?: string | null }).phone) {
    await db.user.update({ where: { id: user.id }, data: { phone: data.address.phone } });
  }

  await grantOrderAccess(order.id);

  // ── Cash on delivery: confirm now ──────────────────────────────────────────
  if (data.paymentMethod === "COD") {
    try {
      await db.$transaction(async (tx) => {
        await commitStock(tx, order.id);
        await tx.order.update({ where: { id: order.id }, data: { status: "CONFIRMED" } });
        await tx.orderEvent.create({ data: { orderId: order.id, status: "CONFIRMED", message: "Cash on delivery order confirmed" } });
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        await tx.cart.update({ where: { id: cart.id }, data: { couponCode: null, giftWrap: false, giftMessage: null, freeSampleProductId: null } });
      });
    } catch {
      await db.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
      await db.orderEvent.create({ data: { orderId: order.id, status: "CANCELLED", message: "Cancelled automatically — item went out of stock", internal: true } });
      return { ok: false, error: "OUT_OF_STOCK" };
    }
    await confirmCodOrder(order.id);
    return { ok: true, number, mode: "cod" };
  }

  // ── Paytm: start the transaction; the callback/webhook settle it ───────────
  try {
    const phone10 = data.address.phone.slice(-10);
    const txnToken = await initiateTransaction({
      orderId: number,
      amount: totals.total,
      callbackUrl: new URL("/api/paytm/callback", site.url).toString(),
      customer: { id: user?.id ?? `GUEST_${phone10}`, email: data.email, mobile: phone10 },
    });
    return {
      ok: true,
      number,
      mode: "paytm",
      paytm: { mid: paytmMid(), scriptUrl: paytmScriptUrl(), orderId: number, txnToken, amount: toPaytmAmount(totals.total) },
    };
  } catch (e) {
    console.error("[checkout] paytm", e);
    await db.order.update({ where: { id: order.id }, data: { status: "CANCELLED", paymentStatus: "FAILED" } });
    return { ok: false, error: "GENERIC" };
  }
}

/** Paytm checkout closed without paying — record it so the admin sees abandoned attempts. */
export async function markPaymentFailed(input: { orderNumber: string; reason?: string }) {
  const order = await db.order.findUnique({ where: { gatewayOrderId: String(input.orderNumber) }, select: { id: true, paymentStatus: true } });
  if (!order || order.paymentStatus !== "PENDING") return;
  await db.orderEvent.create({ data: { orderId: order.id, message: `Payment not completed${input.reason ? `: ${String(input.reason).slice(0, 120)}` : ""}`, internal: true } });
}
