import { ArrowDownRight, ArrowUpRight, Boxes, CreditCard, PackageCheck, Star } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { BarList, RevenueChart, ShareMeter, type DayPoint } from "@/components/admin/charts";
import { addressLines, fmtAgo, money } from "@/components/admin/format";
import { Card, PageHeader, StatusBadge } from "@/components/admin/ui";
import type { OrderStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { requireAdminPage } from "@/server/admin/auth";
import { LOW_STOCK } from "@/server/admin/constants";
import { first } from "@/server/admin/queries";

export const metadata = { title: "Dashboard" };

const RANGES = [7, 30, 90] as const;
/** Orders that count as sales: confirmed onwards, excluding cancelled and refunded. */
const SALE: { notIn: OrderStatus[] } = { notIn: ["PENDING", "CANCELLED", "REFUNDED", "RETURNED"] };
const DAY = 86_400_000;
const istDay = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  const admin = await requireAdminPage("/admin");
  const sp = await searchParams;
  const days = RANGES.find((r) => String(r) === first(sp.range)) ?? 30;

  // Whole IST days: the range ends today and starts `days - 1` days earlier
  const todayStart = new Date(`${istDay(new Date())}T00:00:00+05:30`);
  const start = new Date(todayStart.getTime() - (days - 1) * DAY);
  const prevStart = new Date(start.getTime() - days * DAY);

  const [sales, prevSales, newCustomers, prevCustomers, toPack, awaitingPayment, lowStock, pendingReviews, recent, lowList] = await Promise.all([
    db.order.findMany({ where: { createdAt: { gte: start }, status: SALE }, select: { id: true, total: true, createdAt: true, paymentMethod: true } }),
    db.order.aggregate({ where: { createdAt: { gte: prevStart, lt: start }, status: SALE }, _sum: { total: true }, _count: { _all: true } }),
    db.user.count({ where: { role: "customer", createdAt: { gte: start } } }),
    db.user.count({ where: { role: "customer", createdAt: { gte: prevStart, lt: start } } }),
    db.order.count({ where: { status: "CONFIRMED" } }),
    db.order.count({ where: { status: "PENDING", paymentMethod: "ONLINE", createdAt: { gte: new Date(todayStart.getTime() - DAY) } } }),
    db.variant.count({ where: { stock: { lte: LOW_STOCK }, form: { product: { status: "ACTIVE" } } } }),
    db.review.count({ where: { status: "PENDING" } }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, select: { number: true, total: true, status: true, createdAt: true, shippingAddress: true, paymentMethod: true } }),
    db.variant.findMany({
      where: { stock: { lte: LOW_STOCK }, form: { product: { status: "ACTIVE" } } },
      orderBy: { stock: "asc" },
      take: 5,
      select: { id: true, label: true, stock: true, form: { select: { type: true, product: { select: { id: true, name: true } } } } },
    }),
  ]);

  // Grouped by product web address, so a re-created product still counts as one
  const grouped = sales.length
    ? await db.orderItem.groupBy({ by: ["productSlug"], where: { orderId: { in: sales.map((s) => s.id) }, unitPrice: { gt: 0 } }, _sum: { total: true, quantity: true }, orderBy: { _sum: { total: "desc" } }, take: 6 })
    : [];
  const names = await db.orderItem.findMany({ where: { productSlug: { in: grouped.map((g) => g.productSlug) } }, distinct: ["productSlug"], select: { productSlug: true, name: true } });
  const items = grouped.map((g) => ({ ...g, name: names.find((n) => n.productSlug === g.productSlug)?.name ?? g.productSlug }));

  const revenue = sales.reduce((n, s) => n + s.total, 0);
  const prevRevenue = prevSales._sum.total ?? 0;
  const orders = sales.length;
  const aov = orders ? Math.round(revenue / orders) : 0;
  const prevAov = prevSales._count._all ? Math.round(prevRevenue / prevSales._count._all) : 0;
  const cod = sales.filter((s) => s.paymentMethod === "COD").length;

  const points: DayPoint[] = Array.from({ length: days }, (_, i) => {
    const d = new Date(start.getTime() + i * DAY);
    const key = istDay(d);
    const dayOrders = sales.filter((s) => istDay(s.createdAt) === key);
    return {
      date: key,
      label: new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }).format(d),
      revenue: dayOrders.reduce((n, s) => n + s.total, 0),
      orders: dayOrders.length,
    };
  });

  const hour = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <PageHeader title={`${greeting}, ${admin.name.split(" ")[0]}`} description="Here’s how the house of Aayat al-Ruh is doing." />

      {/* Needs attention — operational, not scoped by the range */}
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Todo href="/admin/orders?tab=pack" icon={<PackageCheck />} count={toPack} label="orders to pack" calm="No orders waiting to be packed" />
        <Todo href="/admin/orders?tab=unpaid" icon={<CreditCard />} count={awaitingPayment} label="online payments pending" calm="No payments pending" />
        <Todo href="/admin/inventory" icon={<Boxes />} count={lowStock} label={`sizes with ${LOW_STOCK} or fewer left`} calm="Stock levels look healthy" />
        <Todo href="/admin/reviews" icon={<Star />} count={pendingReviews} label="reviews to approve" calm="No reviews waiting" />
      </div>

      {/* Filter row scopes everything below it */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm text-ink-muted">Showing</span>
        <div className="flex rounded-lg bg-[#efe7d8] p-0.5">
          {RANGES.map((r) => (
            <Link key={r} href={`/admin?range=${r}`} className={cn("rounded-md px-3 py-1 text-sm", r === days ? "bg-white font-semibold text-ink shadow-sm" : "text-ink-muted hover:text-ink")}>
              Last {r} days
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label="Revenue" value={money(revenue)} now={revenue} before={prevRevenue} days={days} />
        <Tile label="Orders" value={orders.toLocaleString("en-IN")} now={orders} before={prevSales._count._all} days={days} />
        <Tile label="Average order" value={money(aov)} now={aov} before={prevAov} days={days} />
        <Tile label="New customer accounts" value={newCustomers.toLocaleString("en-IN")} now={newCustomers} before={prevCustomers} days={days} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="min-w-0">
          <RevenueChart points={points} title={`Revenue per day · last ${days} days`} />
        </Card>
        <div className="space-y-6">
          <Card title="Top products" description={`By revenue, last ${days} days`}>
            <BarList rows={items.map((i) => ({ key: i.productSlug, label: i.name, value: i._sum.total ?? 0, sub: `${i._sum.quantity ?? 0} sold` }))} empty="No sales in this period yet" />
          </Card>
          <Card title="How customers pay" description={`${orders} order${orders === 1 ? "" : "s"}, last ${days} days`}>
            {orders ? <ShareMeter part={orders - cod} whole={orders} partLabel="Online" restLabel="Cash on delivery" /> : <p className="text-sm text-ink-muted">No orders yet.</p>}
          </Card>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card title="Latest orders" actions={<Link href="/admin/orders" className="text-xs font-semibold text-gold-deep hover:underline">All orders →</Link>} padded={false}>
          <ul>
            {recent.map((o) => (
              <li key={o.number} className="relative flex items-center gap-4 border-b border-[#f0e8d9] px-5 py-3 last:border-0 hover:bg-[#fcf9f3]">
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/orders/${o.number}`} className="text-sm font-semibold text-ink after:absolute after:inset-0">
                    {o.number}
                  </Link>
                  <p className="truncate text-xs text-ink-muted">
                    {addressLines(o.shippingAddress).name} · {o.paymentMethod === "COD" ? "COD" : "Online"} · {fmtAgo(o.createdAt)}
                  </p>
                </div>
                <span className="text-sm tabular-nums text-ink">{money(o.total)}</span>
                <StatusBadge status={o.status} />
              </li>
            ))}
            {!recent.length ? <li className="px-5 py-8 text-center text-sm text-ink-muted">No orders yet.</li> : null}
          </ul>
        </Card>
        <Card title="Running low" actions={<Link href="/admin/inventory" className="text-xs font-semibold text-gold-deep hover:underline">Inventory →</Link>} padded={false}>
          <ul>
            {lowList.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-3 border-b border-[#f0e8d9] px-5 py-2.5 text-sm last:border-0">
                <Link href={`/admin/products/${v.form.product.id}`} className="min-w-0 truncate text-ink hover:text-gold-deep">
                  {v.form.product.name} <span className="text-xs text-ink-muted">· {v.form.type.toLowerCase()} {v.label}</span>
                </Link>
                <span className={cn("shrink-0 text-xs font-semibold", v.stock === 0 ? "text-ruby" : "text-[#8a6a2c]")}>{v.stock === 0 ? "Sold out" : `${v.stock} left`}</span>
              </li>
            ))}
            {!lowList.length ? <li className="px-5 py-8 text-center text-sm text-ink-muted">Nothing is running low.</li> : null}
          </ul>
        </Card>
      </div>
    </>
  );
}

function Todo({ href, icon, count, label, calm }: { href: string; icon: ReactNode; count: number; label: string; calm: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl border p-4 transition-colors [&_svg]:size-5",
        count ? "border-[#ecd9a8] bg-[#fdf6e3] text-ink hover:border-gold-deep" : "border-[#e9dfcc] bg-white text-ink-muted hover:border-[#dccfb6]",
      )}
    >
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg", count ? "bg-gold/25 text-gold-deep" : "bg-[#f3ecdf] text-ink-muted")}>{icon}</span>
      <span className="text-sm">{count ? <><strong className="text-lg font-semibold text-ink">{count}</strong> {label}</> : calm}</span>
    </Link>
  );
}

function Tile({ label, value, now, before, days }: { label: string; value: string; now: number; before: number; days: number }) {
  const delta = before ? Math.round(((now - before) / before) * 100) : null;
  const up = delta !== null && delta >= 0;
  return (
    <div className="rounded-xl border border-[#e9dfcc] bg-white p-5">
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
      <p className="mt-1 flex items-center gap-1 text-xs text-ink-muted">
        {delta === null ? (
          `Nothing to compare with in the previous ${days} days`
        ) : (
          <>
            {/* Direction is carried by the icon and the signed number, not colour alone */}
            {up ? <ArrowUpRight className="size-3.5 text-[#0ca30c]" aria-hidden /> : <ArrowDownRight className="size-3.5 text-[#d03b3b]" aria-hidden />}
            <span className="font-semibold text-ink">
              {up ? "+" : "−"}
              {Math.abs(delta)}%
            </span>{" "}
            vs previous {days} days
          </>
        )}
      </p>
    </div>
  );
}
