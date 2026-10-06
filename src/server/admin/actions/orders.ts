"use server";

import { z } from "zod";
import type { OrderStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { sendShippingUpdate } from "@/lib/emails/order-emails";
import { paytmEnabled } from "@/lib/paytm";
import { reconcilePaytmOrder } from "../../payments";
import { requireAdminAction } from "../auth";
import { refreshStorefront } from "../refresh";
import { done, fail, invalid, type ActionResult } from "../result";

const STATUSES = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"] as const;
/** Statuses the customer gets an email about */
const EMAILED = new Set(["PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED"]);

const statusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(STATUSES),
  courier: z.string().trim().max(80).optional().default(""),
  trackingNumber: z.string().trim().max(80).optional().default(""),
  trackingUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .default("")
    .refine((v) => !v || /^https?:\/\//.test(v), "Tracking link must start with http:// or https://"),
  notify: z.boolean().default(true),
  restock: z.boolean().default(true),
});

/** Put the units of a cancelled order back on the shelf (once). */
async function releaseStock(orderId: string) {
  await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order?.stockCommitted) return;
    for (const item of order.items) {
      if (item.variantId) await tx.variant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
    }
    await tx.order.update({ where: { id: orderId }, data: { stockCommitted: false } });
    if (order.couponCode) await tx.coupon.updateMany({ where: { code: order.couponCode, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } });
  });
}

export async function updateOrderStatus(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdminAction();
  const parsed = statusSchema.safeParse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
    courier: formData.get("courier") ?? "",
    trackingNumber: formData.get("trackingNumber") ?? "",
    trackingUrl: formData.get("trackingUrl") ?? "",
    notify: formData.get("notify") === "on",
    restock: formData.get("restock") === "on",
  });
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;

  const order = await db.order.findUnique({ where: { id: d.orderId }, include: { items: true } });
  if (!order) return fail("Order not found");
  if (d.status === "SHIPPED" && !d.trackingNumber && !order.trackingNumber) {
    return fail("Add the courier tracking number before marking the order shipped.", { trackingNumber: "Required when shipping" });
  }

  const statusChanged = d.status !== order.status;
  const trackingChanged = d.courier !== (order.courier ?? "") || d.trackingNumber !== (order.trackingNumber ?? "") || d.trackingUrl !== (order.trackingUrl ?? "");
  if (!statusChanged && !trackingChanged) return done("Nothing changed");

  if (statusChanged && (d.status === "CANCELLED" || d.status === "RETURNED") && d.restock) await releaseStock(order.id);

  const payment =
    d.status === "DELIVERED" && order.paymentMethod === "COD" && order.paymentStatus !== "PAID"
      ? { paymentStatus: "PAID" as const, paidAt: new Date() }
      : d.status === "REFUNDED"
        ? { paymentStatus: "REFUNDED" as const }
        : {};

  const updated = await db.order.update({
    where: { id: order.id },
    data: {
      status: d.status as OrderStatus,
      courier: d.courier || null,
      trackingNumber: d.trackingNumber || null,
      trackingUrl: d.trackingUrl || null,
      ...payment,
      events: {
        create: [
          ...(statusChanged ? [{ status: d.status as OrderStatus, message: statusMessage(d.status, d.courier, d.trackingNumber) }] : []),
          ...(!statusChanged && trackingChanged ? [{ message: `Tracking updated${d.trackingNumber ? `: ${d.courier} ${d.trackingNumber}`.trim() : ""}` }] : []),
          ...("paymentStatus" in payment && payment.paymentStatus === "PAID" ? [{ message: "Cash collected on delivery", internal: true }] : []),
          { message: `Updated by ${admin.name}`, internal: true },
        ],
      },
    },
    include: { items: true },
  });

  let emailed = false;
  if (d.notify && statusChanged && EMAILED.has(d.status)) {
    try {
      await sendShippingUpdate({ ...updated, status: d.status });
      emailed = true;
    } catch (e) {
      console.error("[admin] status email", e);
    }
  }
  if (statusChanged && (d.status === "CANCELLED" || d.status === "RETURNED")) refreshStorefront("catalog");
  return done(emailed ? "Order updated — customer emailed" : "Order updated");
}

function statusMessage(status: string, courier: string, tracking: string) {
  switch (status) {
    case "CONFIRMED":
      return "Order confirmed";
    case "PACKED":
      return "Packed and ready to ship";
    case "SHIPPED":
      return `Shipped${courier ? ` with ${courier}` : ""}${tracking ? ` · ${tracking}` : ""}`;
    case "OUT_FOR_DELIVERY":
      return "Out for delivery";
    case "DELIVERED":
      return "Delivered";
    case "CANCELLED":
      return "Order cancelled";
    case "RETURNED":
      return "Order returned";
    case "REFUNDED":
      return "Refund processed";
    default:
      return "Status updated";
  }
}

const noteSchema = z.object({ orderId: z.string().min(1), message: z.string().trim().min(1, "Write a note").max(1000), visible: z.boolean() });

export async function addOrderNote(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdminAction();
  const parsed = noteSchema.safeParse({ orderId: formData.get("orderId"), message: formData.get("message"), visible: formData.get("visible") === "on" });
  if (!parsed.success) return invalid(parsed.error);
  const { orderId, message, visible } = parsed.data;
  if (!(await db.order.findUnique({ where: { id: orderId }, select: { id: true } }))) return fail("Order not found");
  await db.orderEvent.create({ data: { orderId, message: visible ? message : `${message} — ${admin.name}`, internal: !visible } });
  return done(visible ? "Update added to the customer’s timeline" : "Note saved");
}

/** Ask Paytm again about an online payment that is still pending. */
export async function recheckPayment(orderId: string): Promise<ActionResult> {
  await requireAdminAction();
  if (!paytmEnabled()) return fail("Paytm is not configured yet.");
  const order = await db.order.findUnique({ where: { id: String(orderId) }, select: { gatewayOrderId: true } });
  if (!order?.gatewayOrderId) return fail("This order has no online payment.");
  try {
    const outcome = await reconcilePaytmOrder(order.gatewayOrderId);
    return done(outcome.result === "PAID" ? "Payment confirmed by Paytm" : outcome.result === "PENDING" ? "Still pending at Paytm" : "Paytm reports the payment did not complete");
  } catch (e) {
    console.error("[admin] recheck", e);
    return fail("Could not reach Paytm — try again in a minute.");
  }
}
