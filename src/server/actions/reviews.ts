"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { getSessionUser } from "../session";

const schema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(80).optional().default(""),
  body: z.string().trim().min(15).max(2000),
  authorName: z.string().trim().min(2).max(60),
  location: z.string().trim().max(60).optional().default(""),
  // Honeypot: real people never fill this hidden field
  website: z.string().max(0).optional().default(""),
});

export type ReviewResult = { ok: true } | { ok: false; error: "INVALID" | "RATE_LIMIT" | "NOT_FOUND" };

/** A customer review. It waits for approval in Admin → Reviews before it shows. */
export async function submitReview(input: z.input<typeof schema>): Promise<ReviewResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID" };
  if (!(await rateLimit("review", 5, 3600))) return { ok: false, error: "RATE_LIMIT" };
  const r = parsed.data;

  const product = await db.product.findFirst({ where: { id: r.productId, status: "ACTIVE" }, select: { id: true } });
  if (!product) return { ok: false, error: "NOT_FOUND" };

  // "Verified buyer" only for signed-in customers with a delivered or paid order of this product
  const user = await getSessionUser();
  const bought = user
    ? await db.order.count({
        where: { userId: user.id, items: { some: { productId: product.id } }, OR: [{ status: "DELIVERED" }, { paymentStatus: "PAID" }] },
      })
    : 0;

  await db.review.create({
    data: {
      productId: product.id,
      userId: user?.id ?? null,
      authorName: r.authorName,
      location: r.location || null,
      rating: r.rating,
      title: r.title || null,
      body: r.body,
      verified: bought > 0,
      status: "PENDING",
    },
  });
  return { ok: true };
}
