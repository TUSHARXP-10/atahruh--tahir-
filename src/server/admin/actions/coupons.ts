"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdminAction } from "../auth";
import { done, fail, invalid, uniqueViolation, type ActionResult } from "../result";

const optionalNumber = z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.coerce.number().min(0).optional());
const optionalInt = z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.coerce.number().int().min(1).optional());
const optionalDate = z.preprocess((v) => (v ? new Date(`${v}T00:00:00+05:30`) : undefined), z.date().optional());

const schema = z.object({
  id: z.string().optional(),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(3, "Code needs at least 3 characters")
    .max(30)
    .regex(/^[A-Z0-9_-]+$/, "Code: letters, numbers, dash or underscore only"),
  type: z.enum(["PERCENT", "FLAT", "FREE_SHIPPING"]),
  value: optionalNumber,
  minSubtotal: optionalNumber,
  maxDiscount: optionalNumber,
  startsAt: optionalDate,
  endsAt: optionalDate,
  usageLimit: optionalInt,
  perUserLimit: optionalInt,
  firstOrderOnly: z.boolean(),
  active: z.boolean(),
  description: z.string().trim().max(200).optional().default(""),
});

export async function saveCoupon(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireAdminAction();
  const raw = Object.fromEntries(formData) as Record<string, unknown>;
  const parsed = schema.safeParse({ ...raw, id: raw.id || undefined, firstOrderOnly: raw.firstOrderOnly === "on", active: raw.active === "on" });
  if (!parsed.success) return invalid(parsed.error);
  const c = parsed.data;

  if (c.type === "PERCENT" && (!c.value || c.value > 90)) return fail("Percentage must be between 1 and 90.", { value: "1–90" });
  if (c.type === "FLAT" && !c.value) return fail("Enter the discount amount in rupees.", { value: "Required" });
  if (c.startsAt && c.endsAt && c.endsAt < c.startsAt) return fail("The end date is before the start date.");

  const data = {
    code: c.code,
    type: c.type,
    // PERCENT stores whole percent, FLAT stores paise
    value: c.type === "PERCENT" ? Math.round(c.value ?? 0) : c.type === "FLAT" ? Math.round((c.value ?? 0) * 100) : 0,
    minSubtotal: Math.round((c.minSubtotal ?? 0) * 100),
    maxDiscount: c.type === "PERCENT" && c.maxDiscount ? Math.round(c.maxDiscount * 100) : null,
    startsAt: c.startsAt ?? null,
    // Inclusive end date: valid until the end of that day (IST)
    endsAt: c.endsAt ? new Date(c.endsAt.getTime() + 86_399_999) : null,
    usageLimit: c.usageLimit ?? null,
    perUserLimit: c.perUserLimit ?? null,
    firstOrderOnly: c.firstOrderOnly,
    active: c.active,
    description: c.description || null,
  };
  try {
    if (c.id) await db.coupon.update({ where: { id: c.id }, data });
    else await db.coupon.create({ data });
  } catch (e) {
    return uniqueViolation(e, "coupon code") ?? fail("Could not save the coupon.");
  }
  return done(c.id ? "Coupon saved" : `Coupon ${c.code} created`, { redirect: "/admin/coupons" });
}

export async function toggleCoupon(id: string, active: boolean): Promise<ActionResult> {
  await requireAdminAction();
  await db.coupon.update({ where: { id: String(id) }, data: { active: !!active } });
  return done(active ? "Coupon switched on" : "Coupon switched off");
}

export async function deleteCoupon(id: string): Promise<ActionResult> {
  await requireAdminAction();
  await db.coupon.delete({ where: { id: String(id) } });
  return done("Coupon deleted", { redirect: "/admin/coupons" });
}
