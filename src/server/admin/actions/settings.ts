"use server";

import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireAdminAction } from "../auth";
import { refreshStorefront } from "../refresh";
import { done, fail, invalid, type ActionResult } from "../result";

const rupees = z.coerce.number().min(0).max(10_000_000).transform((r) => Math.round(r * 100));
const url = z.string().trim().max(300).refine((v) => !v || /^https:\/\//.test(v), "Links must start with https://");

const GROUPS = {
  commerce: z.object({
    freeShippingThreshold: rupees,
    standardShippingFee: rupees,
    expressShippingFee: rupees,
    codFee: rupees,
    codMaxOrder: rupees,
    giftWrapFee: rupees,
    freeSampleThreshold: rupees,
    gstRatePercent: z.coerce.number().min(0).max(28),
  }),
  contact: z.object({
    email: z.string().trim().email("Enter a valid email").max(200),
    phone: z.string().trim().min(6).max(40),
    whatsapp: z
      .string()
      .trim()
      .transform((v) => v.replace(/\D/g, ""))
      .pipe(z.string().regex(/^\d{10,15}$/, "WhatsApp: country code + number, e.g. 919876543210")),
    address: z.string().trim().max(200),
    hours: z.string().trim().max(100),
  }),
  business: z.object({
    legalName: z.string().trim().min(2).max(120),
    gstin: z
      .string()
      .trim()
      .toUpperCase()
      .refine((v) => !v || /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(v), "That GSTIN doesn’t look right (15 characters, e.g. 27ABCDE1234F1Z5)"),
    address: z.string().trim().max(300),
    state: z.string().trim().min(2).max(60),
  }),
  socials: z.object({ instagram: url, facebook: url, youtube: url, pinterest: url }),
} as const;

export async function saveSettings(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireAdminAction();
  const group = String(formData.get("group")) as keyof typeof GROUPS;
  const schema = GROUPS[group];
  if (!schema) return fail("Unknown settings group");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  await db.setting.upsert({
    where: { key: group },
    update: { value: parsed.data as Prisma.InputJsonValue },
    create: { key: group, value: parsed.data as Prisma.InputJsonValue },
  });
  refreshStorefront("content");
  return done("Settings saved");
}

/** Give an existing account admin access. */
export async function addAdmin(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireAdminAction();
  const email = z.string().trim().toLowerCase().email().safeParse(formData.get("email"));
  if (!email.success) return fail("Enter the email of an existing account");
  const user = await db.user.findUnique({ where: { email: email.data } });
  if (!user) return fail("No account with that email — ask them to create an account on the website first.");
  if (user.role === "admin") return done(`${user.email} is already an admin`);
  await db.user.update({ where: { id: user.id }, data: { role: "admin" } });
  return done(`${user.email} can now open the admin`);
}

export async function removeAdmin(userId: string): Promise<ActionResult> {
  const me = await requireAdminAction();
  if (String(userId) === me.id) return fail("You can’t remove your own admin access.");
  const admins = await db.user.count({ where: { role: "admin" } });
  if (admins <= 1) return fail("There must be at least one admin.");
  await db.user.update({ where: { id: String(userId) }, data: { role: "customer" } });
  await db.session.deleteMany({ where: { userId: String(userId) } });
  return done("Admin access removed");
}
