import { Download, Search } from "lucide-react";
import Link from "next/link";
import { fmtDate, money } from "@/components/admin/format";
import { Card, EmptyState, PageHeader, Pagination, Table, TextInput, buttonClass } from "@/components/admin/ui";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { requireAdminPage } from "@/server/admin/auth";
import { PAGE_SIZE } from "@/server/admin/constants";
import { first, pageOf } from "@/server/admin/queries";

export const metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  await requireAdminPage("/admin/customers");
  const sp = await searchParams;
  const tab = first(sp.tab) === "newsletter" ? "newsletter" : "accounts";
  const q = first(sp.q)?.trim() ?? "";
  const page = pageOf(sp.page);

  const [accountCount, subscriberCount] = await Promise.all([db.user.count({ where: { role: "customer" } }), db.newsletterSubscriber.count()]);

  return (
    <>
      <PageHeader
        title="Customers"
        description="Account holders and newsletter subscribers. Guest buyers appear in Orders."
        actions={
          <a href={`/api/admin/customers/export?type=${tab}`} className={buttonClass("secondary")}>
            <Download /> Export {tab === "newsletter" ? "subscribers" : "customers"} CSV
          </a>
        }
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 border-b border-[#e9dfcc]">
          {(
            [
              ["accounts", `Accounts (${accountCount})`],
              ["newsletter", `Newsletter (${subscriberCount})`],
            ] as const
          ).map(([k, label]) => (
            <Link key={k} href={`/admin/customers?tab=${k}`} className={cn("-mb-px border-b-2 px-3 py-2.5 text-sm", tab === k ? "border-ink font-semibold text-ink" : "border-transparent text-ink-muted hover:text-ink")}>
              {label}
            </Link>
          ))}
        </div>
        <form className="relative w-72" action="/admin/customers">
          <input type="hidden" name="tab" value={tab} />
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
          <TextInput name="q" defaultValue={q} placeholder="Name, email or phone" className="ps-9" aria-label="Search customers" />
        </form>
      </div>
      {tab === "accounts" ? <Accounts q={q} page={page} /> : <Subscribers q={q} page={page} />}
    </>
  );
}

async function Accounts({ q, page }: { q: string; page: number }) {
  const where: Prisma.UserWhereInput = {
    role: "customer",
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } : {}),
  };
  const [users, total] = await Promise.all([
    db.user.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, select: { id: true, name: true, email: true, phone: true, createdAt: true } }),
    db.user.count({ where }),
  ]);
  const spend = await db.order.groupBy({
    by: ["userId"],
    where: { userId: { in: users.map((u) => u.id) }, status: { notIn: ["CANCELLED", "PENDING", "REFUNDED", "RETURNED"] } },
    _sum: { total: true },
    _count: { _all: true },
    _max: { createdAt: true },
  });
  return (
    <Card padded={false}>
      {users.length ? (
        <>
          <Table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Joined</th>
                <th className="text-end">Orders</th>
                <th className="text-end">Spent</th>
                <th>Last order</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const s = spend.find((x) => x.userId === u.id);
                return (
                  <tr key={u.id}>
                    <td>
                      <p className="font-medium text-ink">{u.name}</p>
                      <Link href={`/admin/orders?q=${encodeURIComponent(u.email)}`} className="text-xs text-ink-muted hover:text-ink">
                        {u.email}
                      </Link>
                    </td>
                    <td className="text-ink-muted">{u.phone ?? "—"}</td>
                    <td className="text-ink-muted">{fmtDate(u.createdAt)}</td>
                    <td className="text-end tabular-nums">{s?._count._all ?? 0}</td>
                    <td className="text-end tabular-nums">{s?._sum.total ? money(s._sum.total) : "—"}</td>
                    <td className="text-ink-muted">{s?._max.createdAt ? fmtDate(s._max.createdAt) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          <Pagination page={page} pages={Math.ceil(total / PAGE_SIZE)} href={(p) => `/admin/customers?tab=accounts&page=${p}${q ? `&q=${encodeURIComponent(q)}` : ""}`} />
        </>
      ) : (
        <EmptyState title="No customer accounts yet" text="Customers who create an account at checkout or sign-up appear here." />
      )}
    </Card>
  );
}

async function Subscribers({ q, page }: { q: string; page: number }) {
  const where: Prisma.NewsletterSubscriberWhereInput = q ? { email: { contains: q, mode: "insensitive" } } : {};
  const [rows, total] = await Promise.all([
    db.newsletterSubscriber.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.newsletterSubscriber.count({ where }),
  ]);
  return (
    <Card padded={false}>
      {rows.length ? (
        <>
          <Table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Language</th>
                <th>Signed up from</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td className="text-ink">{s.email}</td>
                  <td className="text-ink-muted">{s.locale === "ar" ? "Arabic" : "English"}</td>
                  <td className="text-ink-muted">{s.source ?? "—"}</td>
                  <td className="text-ink-muted">{fmtDate(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination page={page} pages={Math.ceil(total / PAGE_SIZE)} href={(p) => `/admin/customers?tab=newsletter&page=${p}${q ? `&q=${encodeURIComponent(q)}` : ""}`} />
        </>
      ) : (
        <EmptyState title="No subscribers yet" text="Sign-ups from the homepage newsletter form appear here." />
      )}
    </Card>
  );
}
