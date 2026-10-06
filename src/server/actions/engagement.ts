"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { emailLayout, sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { site } from "@/lib/site";

const email = z.string().trim().toLowerCase().email().max(200);

export async function requestBackInStock(input: { variantId: string; email: string }) {
  const parsed = z.object({ variantId: z.string().min(1), email }).safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "INVALID" };
  if (!(await rateLimit("bis", 10, 3600))) return { ok: false as const, error: "RATE_LIMIT" };
  const variant = await db.variant.findUnique({ where: { id: parsed.data.variantId }, select: { id: true } });
  if (!variant) return { ok: false as const, error: "NOT_FOUND" };
  await db.backInStockRequest.upsert({
    where: { variantId_email: { variantId: variant.id, email: parsed.data.email } },
    create: { variantId: variant.id, email: parsed.data.email },
    update: { notifiedAt: null },
  });
  return { ok: true as const };
}

const WELCOME_CODE = "WELCOME10";

export async function subscribeNewsletter(input: { email: string; locale: string; source?: string; /** Honeypot — real visitors never fill it */ website?: string }) {
  const parsed = email.safeParse(input.email);
  if (!parsed.success) return { ok: false as const, error: "INVALID" as const };
  // A bot filled the hidden field: answer as if it worked, store nothing
  if (input.website) return { ok: true as const, already: false, code: WELCOME_CODE };
  if (!(await rateLimit("newsletter", 5, 3600))) return { ok: false as const, error: "RATE_LIMIT" as const };

  const existing = await db.newsletterSubscriber.findUnique({ where: { email: parsed.data } });
  if (existing) return { ok: true as const, already: true, code: existing.couponCode ?? WELCOME_CODE };

  await db.newsletterSubscriber.create({
    data: { email: parsed.data, locale: input.locale === "ar" ? "ar" : "en", source: input.source ?? "footer", couponCode: WELCOME_CODE },
  });

  const ar = input.locale === "ar";
  void sendEmail({
    to: parsed.data,
    subject: ar ? "أهلاً بك في عائلة آيات الروح" : "Welcome to the Aayat al-Ruh family",
    html: emailLayout({
      title: "Welcome",
      preheader: ar ? `رمزك ${WELCOME_CODE} بانتظارك` : `Your code ${WELCOME_CODE} is inside`,
      body: ar
        ? `<div dir="rtl" style="text-align:right"><p>أهلاً بك في الدائرة المقرّبة.</p><p>استخدم الرمز <strong style="color:#e8cd92;letter-spacing:2px">${WELCOME_CODE}</strong> للحصول على خصم ١٠٪ على طلبك الأول.</p><p><a href="${site.url}/ar/shop" style="color:#c9a55c">تسوّق الآن</a></p></div>`
        : `<p>Welcome to the inner circle.</p><p>Use <strong style="color:#e8cd92;letter-spacing:2px">${WELCOME_CODE}</strong> for 10% off your first order — and expect early access to every new launch.</p><p><a href="${site.url}/shop" style="color:#c9a55c">Shop the collection →</a></p>`,
    }),
  });

  return { ok: true as const, already: false, code: WELCOME_CODE };
}
