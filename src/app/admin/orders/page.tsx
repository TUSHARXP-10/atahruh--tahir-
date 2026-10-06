import { Download, Search } from "lucide-react";
import Link from "next/link";
import { addressLines, fmtDateTime, money } from "@/components/admin/format";
import { ALink, Card, EmptyState, PageHeader, Pagination, StatusBadge, Table, TextInput, buttonClass } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { requireAdminPage } from "@/server/admin/auth";
import { PAGE_SIZE } from "@/server/admin/constants";
import { first, ORDER_TABS, orderWhere, pageOf } from "@/server/admin/queries";

export const metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdminPage("/admin/orders");
  const sp = await searchParams;
  const tab = first(sp.tab) ?? "all";
  const q = first(sp.q) ?? "";
  const from = first(sp.from) ?? "";
  const to = first(sp.to) ?? "";
  const page = pageOf(sp.page);
  const where = orderWhere({ tab, q, from, to });

  const [orders, total, byStatus] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        number: true,
        createdAt: true,
        email: true,
        shippingAddress: true,
        total: true,
        status: true,
        paymentMethod: true,
        paymentStatus: true,
        _count: { select: { items: true } },
      },
    }),
    db.order.count({ where }),
    db.order.groupBy({ by: ["status"], _count: { _all: true }, where: orderWhere({ q, from, to }) }),
  ]);
  const countFor = (statuses: readonly string[] | null) =>
    byStatus.filter((r) => !statuses || statuses.includes(r.status)).reduce((n, r) => n + r._count._all, 0);

  const qs = (patch: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const merged = { tab, q, from, to, page: undefined as number | string | undefined, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v !== undefined && v !== "" && !(k === "tab" && v === "all")) p.set(k, String(v));
    const s = p.toString();
    return s ? `/admin/orders?${s}` : "/admin/orders";
  };
  const exportHref = `/api/admin/orders/export?${new URLSearchParams({ tab, q, from, to }).toString()}`;

  return (
    <>
      <PageHeader
        title="Orders"
        description="Pack, ship and track every order. Changing a status can email the customer automatically."
        actions={
          <a href={exportHref} className={buttonClass("secondary")}>
            <Download /> Export CSV
          </a>
        }
      />

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-[#e9dfcc]">
        {ORDER_TABS.map((t) => {
          const n = countFor(t.statuses);
          return (
            <Link
              key={t.key}
              href={qs({ tab: t.key })}
              className={cn(
                "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm",
                tab === t.key ? "border-ink font-semibold text-ink" : "border-transparent text-ink-muted hover:text-ink",
              )}
            >
              {t.label}
              <span className={cn("rounded-full px-1.5 text-[0.68rem]", t.key === "pack" && n ? "bg-gold text-ink" : "bg-[#efe7d8] text-ink-muted")}>{n}</span>
            </Link>
          );
        })}
      </div>

      <form className="mb-4 flex flex-wrap items-end gap-2" action="/admin/orders">
        {tab !== "all" ? <input type="hidden" name="tab" value={tab} /> : null}
        <div className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
          <TextInput name="q" defaultValue={q} placeholder="Order number, name, email, phone or tracking number" className="ps-9" aria-label="Search orders" />
        </div>
        <label className="text-xs text-ink-muted">
          From
          <TextInput type="date" name="from" defaultValue={from} className="mt-1 w-40" />
        </label>
        <label className="text-xs text-ink-muted">
          To
          <TextInput type="date" name="to" defaultValue={to} className="mt-1 w-40" />
        </label>
        <button className={buttonClass("primary")}>Search</button>
        {q || from || to ? (
          <ALink href={qs({ q: "", from: "", to: "" })} variant="ghost">
            Clear
          </ALink>
        ) : null}
      </form>

      <Card padded={false}>
        {orders.length ? (
          <>
            <Table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th className="text-end">Items</th>
                  <th className="text-end">Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const a = addressLines(o.shippingAddress);
                  return (
                    <tr key={o.id} className="relative">
                      <td>
                        <Link href={`/admin/orders/${o.number}`} className="font-semibold text-ink after:absolute after:inset-0 hover:text-gold-deep">
                          {o.number}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap text-ink-muted">{fmtDateTime(o.createdAt)}</td>
                      <td>
                        <p className="text-ink">{a.name}</p>
                        <p className="text-xs text-ink-muted">{o.email}</p>
                      </td>
                      <td className="text-end tabular-nums">{o._count.items}</td>
                      <td className="text-end font-medium tabular-nums">{money(o.total)}</td>
                      <td>
                        <span className="me-1.5 text-xs text-ink-muted">{o.paymentMethod === "COD" ? "COD" : "Online"}</span>
                        <StatusBadge status={o.paymentStatus} />
                      </td>
                      <td>
                        <StatusBadge status={o.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            <Pagination page={page} pages={Math.ceil(total / PAGE_SIZE)} href={(p) => qs({ page: p })} />
          </>
        ) : (
          <EmptyState title="No orders here" text={q || from || to ? "Try a different search or date range." : "New orders will appear here as soon as they are placed."} />
        )}
      </Card>
    </>
  );
}
