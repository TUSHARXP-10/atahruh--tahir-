import "server-only";
import { randomInt } from "node:crypto";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { sendOrderConfirmation } from "@/lib/emails/order-emails";
import { CATALOG_TAG } from "./queries/catalog";

export const ORDER_ACCESS_COOKIE = "aar_orders";

/** Human-friendly unique order number, e.g. AAR-261004-4821. */
export async function generateOrderNumber() {
  const d = new Date();
  const stamp = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  for (let i = 0; i < 8; i++) {
    const number = `AAR-${stamp}-${randomInt(1000, 9999)}`;
    if (!(await db.order.findUnique({ where: { number }, select: { id: true } }))) return number;
  }
  return `AAR-${stamp}-${Date.now().toString().slice(-6)}`;
}

/**
 * Decrement stock for every line atomically. Throws "OUT_OF_STOCK" if any
 * variant no longer has enough units (the whole transaction rolls back).
 */
export async function commitStock(tx: Prisma.TransactionClient, orderId: string) {
  const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order || order.stockCommitted) return;
  for (const item of order.items) {
    if (!item.variantId) continue;
    const res = await tx.variant.updateMany({
      where: { id: item.variantId, stock: { gte: item.quantity } },
      data: { stock: { decrement: item.quantity } },
    });
    if (res.count !== 1) throw new Error("OUT_OF_STOCK");
  }
  await tx.order.update({ where: { id: orderId }, data: { stockCommitted: true } });
  if (order.couponCode) {
    await tx.coupon.updateMany({ where: { code: order.couponCode }, data: { usedCount: { increment: 1 } } });
  }
}

/** Remember an order in a cookie so a guest can view its confirmation page. */
export async function grantOrderAccess(orderId: string) {
  const store = await cookies();
  const current = (store.get(ORDER_ACCESS_COOKIE)?.value ?? "").split(",").filter(Boolean);
  store.set(ORDER_ACCESS_COOKIE, [orderId, ...current.filter((id) => id !== orderId)].slice(0, 10).join(","), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function hasOrderAccess(orderId: string) {
  const ids = ((await cookies()).get(ORDER_ACCESS_COOKIE)?.value ?? "").split(",");
  return ids.includes(orderId);
}

const orderWithItems = { items: true } satisfies Prisma.OrderInclude;

async function notifyConfirmed(orderId: string) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: orderWithItems });
  if (order) await sendOrderConfirmation(order);
}

/**
 * Mark an online order paid. Idempotent: the browser callback and the
 * webhook may both call this; only the first one commits stock and emails.
 */
export async function finalizePaidOrder(gatewayOrderId: string, paymentId: string) {
  const o = await db.order.findUnique({ where: { gatewayOrderId }, select: { id: true, paymentStatus: true, cartId: true } });
  if (!o) return { ok: false as const, error: "NOT_FOUND" };
  if (o.paymentStatus === "PAID") return { ok: true as const, orderId: o.id, already: true };

  let stockIssue = false;
  await db.$transaction(async (tx) => {
    const fresh = await tx.order.findUnique({ where: { id: o.id } });
    if (!fresh || fresh.paymentStatus === "PAID") return;
    await tx.order.update({
      where: { id: o.id },
      data: { paymentStatus: "PAID", status: "CONFIRMED", gatewayPaymentId: paymentId, paidAt: new Date() },
    });
    try {
      await commitStock(tx, o.id);
    } catch {
      stockIssue = true;
    }
    await tx.orderEvent.create({
      data: {
        orderId: o.id,
        status: "CONFIRMED",
        message: stockIssue ? "Payment received — stock needs attention" : "Payment received",
        internal: false,
      },
    });
    if (stockIssue) {
      await tx.orderEvent.create({ data: { orderId: o.id, message: "Stock was insufficient when payment completed. Review before packing.", internal: true } });
    }
  });

  // Empty the buyer's cart now that payment is confirmed
  if (o.cartId) await db.cartItem.deleteMany({ where: { cartId: o.cartId } });

  revalidateTag(CATALOG_TAG, "max");
  await notifyConfirmed(o.id);
  return { ok: true as const, orderId: o.id, already: false };
}

export async function confirmCodOrder(orderId: string) {
  await notifyConfirmed(orderId);
}

/** Record a failed online payment (never downgrades an order that is already paid). */
export async function markOrderPaymentFailed(gatewayOrderId: string, reason?: string) {
  const o = await db.order.findUnique({ where: { gatewayOrderId }, select: { id: true, paymentStatus: true } });
  if (!o || o.paymentStatus !== "PENDING") return;
  await db.order.update({ where: { id: o.id }, data: { paymentStatus: "FAILED" } });
  await db.orderEvent.create({
    data: { orderId: o.id, message: `Payment failed${reason ? `: ${reason.slice(0, 160)}` : ""}`, internal: true },
  });
}
