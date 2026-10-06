"use server";

import { db } from "@/lib/db";
import { requireAdminAction } from "../auth";
import { refreshStorefront } from "../refresh";
import { done, type ActionResult } from "../result";

/** Remove the seeded demo reviews and demo testimonials (real ones are untouched). */
export async function purgeDemoContent(): Promise<ActionResult> {
  await requireAdminAction();
  const [reviews, testimonials] = await db.$transaction([db.review.deleteMany({ where: { isPlaceholder: true } }), db.testimonial.deleteMany({ where: { isPlaceholder: true } })]);
  refreshStorefront("reviews", "catalog", "content");
  return done(`Removed ${reviews.count} demo reviews and ${testimonials.count} demo testimonials`);
}

/**
 * Delete test orders placed with @example.com addresses (from development and
 * checkout testing). Stock taken by those orders is put back first.
 */
export async function purgeTestOrders(): Promise<ActionResult> {
  await requireAdminAction();
  const orders = await db.order.findMany({ where: { email: { endsWith: "@example.com" } }, include: { items: true } });
  await db.$transaction(async (tx) => {
    for (const o of orders) {
      if (o.stockCommitted) {
        for (const item of o.items) {
          if (item.variantId) await tx.variant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
        }
      }
      if (o.couponCode && o.stockCommitted) await tx.coupon.updateMany({ where: { code: o.couponCode, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } });
    }
    await tx.order.deleteMany({ where: { id: { in: orders.map((o) => o.id) } } });
  });
  refreshStorefront("catalog");
  return done(`Deleted ${orders.length} test order${orders.length === 1 ? "" : "s"}`);
}
