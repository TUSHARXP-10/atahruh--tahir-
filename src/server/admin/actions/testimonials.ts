"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdminAction } from "../auth";
import { refreshStorefront } from "../refresh";
import { done, invalid, type ActionResult } from "../result";

const schema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Name is required").max(80),
  location: z.string().trim().max(80).default(""),
  quote: z.string().trim().min(10, "Write the quote").max(600),
  quoteAr: z.string().trim().max(600).default(""),
  rating: z.coerce.number().int().min(1).max(5),
  productId: z.string().default(""),
  position: z.coerce.number().int().min(0).max(1000).default(0),
  active: z.boolean(),
});

export async function saveTestimonial(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireAdminAction();
  const raw = Object.fromEntries(formData) as Record<string, unknown>;
  const parsed = schema.safeParse({ ...raw, id: raw.id || undefined, active: raw.active === "on" });
  if (!parsed.success) return invalid(parsed.error);
  const t = parsed.data;
  const data = {
    name: t.name,
    location: t.location || null,
    quote: t.quote,
    quoteAr: t.quoteAr || null,
    rating: t.rating,
    productId: t.productId || null,
    position: t.position,
    active: t.active,
    // Anything saved by an admin is treated as a real customer quote
    isPlaceholder: false,
  };
  if (t.id) await db.testimonial.update({ where: { id: t.id }, data });
  else await db.testimonial.create({ data });
  refreshStorefront("content");
  return done("Testimonial saved", { redirect: "/admin/testimonials" });
}

export async function deleteTestimonial(id: string): Promise<ActionResult> {
  await requireAdminAction();
  await db.testimonial.delete({ where: { id: String(id) } });
  refreshStorefront("content");
  return done("Testimonial deleted", { redirect: "/admin/testimonials" });
}
