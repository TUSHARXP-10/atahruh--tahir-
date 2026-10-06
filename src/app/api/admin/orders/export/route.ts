import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAdmin } from "@/server/admin/auth";
import { orderWhere } from "@/server/admin/queries";

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  // Quote, and neutralise spreadsheet formulas
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replaceAll('"', '""')}"`;
};
const rupees = (paise: number) => (paise / 100).toFixed(2);

/** CSV of the orders matching the list filters (for accounting / courier uploads). */
export async function GET(req: NextRequest) {
  if (!(await getAdmin())) return new Response("Not authorised", { status: 401 });
  const p = req.nextUrl.searchParams;
  const orders = await db.order.findMany({
    where: orderWhere({ tab: p.get("tab") ?? undefined, q: p.get("q") ?? undefined, from: p.get("from") ?? undefined, to: p.get("to") ?? undefined }),
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: { items: true },
  });

  const header = ["Order", "Date (IST)", "Status", "Payment method", "Payment status", "Name", "Email", "Phone", "Address", "City", "State", "Pincode", "Items", "Subtotal", "Discount", "Shipping", "COD fee", "Gift wrap", "Total", "GST included", "Coupon", "Courier", "Tracking"];
  const lines = orders.map((o) => {
    const a = (o.shippingAddress ?? {}) as Record<string, string>;
    return [
      o.number,
      new Intl.DateTimeFormat("en-IN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(o.createdAt),
      o.status,
      o.paymentMethod,
      o.paymentStatus,
      a.name,
      o.email,
      o.phone,
      [a.line1, a.line2, a.landmark].filter(Boolean).join(", "),
      a.city,
      a.state,
      a.pincode,
      o.items.map((i) => `${i.quantity}× ${i.name} (${i.formType} ${i.sizeLabel})`).join("; "),
      rupees(o.subtotal),
      rupees(o.discount),
      rupees(o.shippingFee),
      rupees(o.codFee),
      rupees(o.giftWrapFee),
      rupees(o.total),
      rupees(o.taxIncluded),
      o.couponCode,
      o.courier,
      o.trackingNumber,
    ]
      .map(cell)
      .join(",");
  });
  const csv = "﻿" + [header.map(cell).join(","), ...lines].join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="aayat-orders-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
