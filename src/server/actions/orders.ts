"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { grantOrderAccess } from "../orders";

/** Guest order lookup: order number + the email or phone used at checkout. */
export async function trackOrder(input: { number: string; contact: string }) {
  const parsed = z.object({ number: z.string().trim().min(5).max(40), contact: z.string().trim().min(5).max(200) }).safeParse(input);
  if (!parsed.success) return { ok: false as const };
  if (!(await rateLimit("track", 10, 600))) return { ok: false as const };

  const number = parsed.data.number.toUpperCase();
  const order = await db.order.findUnique({ where: { number }, select: { id: true, email: true, phone: true, number: true } });
  if (!order) return { ok: false as const };

  const contact = parsed.data.contact.toLowerCase().replace(/[\s-]/g, "");
  const phoneDigits = order.phone.replace(/\D/g, "").slice(-10);
  const matches = contact === order.email.toLowerCase() || (contact.replace(/\D/g, "").slice(-10) === phoneDigits && phoneDigits.length === 10);
  if (!matches) return { ok: false as const };

  await grantOrderAccess(order.id);
  return { ok: true as const, number: order.number };
}
