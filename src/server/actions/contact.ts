"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { emailLayout, sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { site } from "@/lib/site";
import { getSettings } from "../queries/content";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(200),
  phone: z.string().trim().max(20).optional().default(""),
  topic: z.enum(["order", "product", "gifting", "wholesale", "other"]),
  orderNumber: z.string().trim().max(30).optional().default(""),
  message: z.string().trim().min(10).max(3000),
  locale: z.string().transform((l) => (l === "ar" ? "ar" : "en")),
  // Honeypot: real people never fill this hidden field
  website: z.string().max(0).optional().default(""),
});

export type ContactResult = { ok: true; email: string } | { ok: false; error: "INVALID" | "RATE_LIMIT"; fields?: string[] };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function sendContactMessage(input: z.input<typeof schema>): Promise<ContactResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID", fields: parsed.error.issues.map((i) => String(i.path[0])) };
  if (!(await rateLimit("contact", 5, 3600))) return { ok: false, error: "RATE_LIMIT" };
  const m = parsed.data;

  await db.contactMessage.create({
    data: { name: m.name, email: m.email, phone: m.phone || null, topic: m.topic, orderNumber: m.orderNumber || null, message: m.message, locale: m.locale },
  });

  const { contact } = await getSettings();
  const rows = [
    ["From", `${esc(m.name)} &lt;${esc(m.email)}&gt;`],
    ["Phone", esc(m.phone || "—")],
    ["Topic", esc(m.topic)],
    ["Order", esc(m.orderNumber || "—")],
  ]
    .map(([k, v]) => `<tr><td style="color:#8a7f70;padding:4px 12px 4px 0">${k}</td><td style="color:#f4ecdd">${v}</td></tr>`)
    .join("");
  void sendEmail({
    to: contact.email,
    subject: `Website message: ${m.topic} — ${m.name}`,
    text: `${m.name} <${m.email}> ${m.phone}\nTopic: ${m.topic}\nOrder: ${m.orderNumber}\n\n${m.message}`,
    html: emailLayout({
      title: "New website message",
      body: `<table role="presentation" cellpadding="0" cellspacing="0">${rows}</table><p style="margin-top:18px;color:#e7d9c0;white-space:pre-line">${esc(m.message)}</p><p style="margin-top:18px"><a href="${site.url}/admin/messages" style="color:#c9a55c">Open in admin →</a></p>`,
    }),
  });
  return { ok: true, email: m.email };
}
