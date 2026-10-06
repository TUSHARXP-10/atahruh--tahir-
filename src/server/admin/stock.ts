import "server-only";
import { db } from "@/lib/db";
import { emailLayout, sendEmail } from "@/lib/email";
import { site } from "@/lib/site";

/**
 * Email everyone waiting on these variants (now back in stock), once each.
 * Returns how many emails were sent.
 */
export async function notifyBackInStock(variantIds: string[]) {
  if (!variantIds.length) return 0;
  const requests = await db.backInStockRequest.findMany({
    where: { variantId: { in: variantIds }, notifiedAt: null, variant: { stock: { gt: 0 }, form: { product: { status: "ACTIVE" } } } },
    include: { variant: { include: { form: { include: { product: { select: { name: true, nameAr: true, slug: true } } } } } } },
    take: 500,
  });
  let sent = 0;
  for (const r of requests) {
    const p = r.variant.form.product;
    const url = `${site.url}/products/${p.slug}?form=${r.variant.form.type.toLowerCase()}`;
    try {
      await sendEmail({
        to: r.email,
        subject: `${p.name} is back in stock — Aayat al-Ruh`,
        html: emailLayout({
          title: `${p.name} is back`,
          preheader: `${p.name} (${r.variant.label}) is available again`,
          body: `<p style="font-family:Georgia,serif;font-size:24px;color:#f4ecdd;margin:0 0 8px">${p.name} is back in stock</p>
<p style="color:#b8ad9b;margin:0 0 6px">The ${r.variant.label} size you asked about is available again — small batches go quickly.</p>
${p.nameAr ? `<p dir="rtl" style="color:#b8ad9b;margin:0 0 18px">${p.nameAr} متوفر من جديد.</p>` : ""}
<p><a href="${url}" style="display:inline-block;background:#c9a55c;color:#1c1510;padding:12px 22px;text-decoration:none;letter-spacing:2px;font-size:12px;text-transform:uppercase">Shop now</a></p>`,
        }),
      });
      await db.backInStockRequest.update({ where: { id: r.id }, data: { notifiedAt: new Date() } });
      sent++;
    } catch (e) {
      console.error("[stock] back-in-stock email", e);
    }
  }
  return sent;
}
