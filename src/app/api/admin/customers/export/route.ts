import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAdmin } from "@/server/admin/auth";

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replaceAll('"', '""')}"`;
};
const day = (d: Date) => d.toISOString().slice(0, 10);

/** CSV of customer accounts or newsletter subscribers (for email tools). */
export async function GET(req: NextRequest) {
  if (!(await getAdmin())) return new Response("Not authorised", { status: 401 });
  const type = req.nextUrl.searchParams.get("type") === "newsletter" ? "newsletter" : "accounts";

  let rows: unknown[][];
  let header: string[];
  if (type === "newsletter") {
    const subs = await db.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" } });
    header = ["Email", "Language", "Source", "Signed up"];
    rows = subs.map((s) => [s.email, s.locale, s.source, day(s.createdAt)]);
  } else {
    const users = await db.user.findMany({
      where: { role: "customer" },
      orderBy: { createdAt: "desc" },
      select: { name: true, email: true, phone: true, createdAt: true, orders: { where: { status: { notIn: ["CANCELLED", "PENDING", "REFUNDED", "RETURNED"] } }, select: { total: true } } },
    });
    header = ["Name", "Email", "Phone", "Joined", "Orders", "Spent (INR)"];
    rows = users.map((u) => [u.name, u.email, u.phone, day(u.createdAt), u.orders.length, (u.orders.reduce((n, o) => n + o.total, 0) / 100).toFixed(2)]);
  }
  const csv = "﻿" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="aayat-${type}-${day(new Date())}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
