import { Plus } from "lucide-react";
import Link from "next/link";
import { fmtDate, money } from "@/components/admin/format";
import { ALink, Card, EmptyState, PageHeader, StatusBadge, Table } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/server/admin/auth";

export const metadata = { title: "Coupons" };

export default async function CouponsPage() {
  await requireAdminPage("/admin/coupons");
  const [coupons, revenue] = await Promise.all([
    db.coupon.findMany({ orderBy: [{ active: "desc" }, { createdAt: "desc" }] }),
    db.order.groupBy({ by: ["couponCode"], where: { couponCode: { not: null }, status: { notIn: ["CANCELLED", "PENDING"] } }, _sum: { total: true, discount: true } }),
  ]);
  const now = new Date();

  return (
    <>
      <PageHeader
        title="Coupons"
        description="Discount codes for campaigns, influencers and first orders."
        actions={
          <ALink href="/admin/coupons/new" variant="primary">
            <Plus /> New coupon
          </ALink>
        }
      />
      <Card padded={false}>
        {coupons.length ? (
          <Table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Valid</th>
                <th className="text-end">Used</th>
                <th className="text-end">Sales with code</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const stats = revenue.find((r) => r.couponCode === c.code);
                const expired = c.endsAt && c.endsAt < now;
                const status = !c.active ? "Off" : expired ? "Expired" : c.startsAt && c.startsAt > now ? "Scheduled" : c.usageLimit != null && c.usedCount >= c.usageLimit ? "Used up" : "Live";
                return (
                  <tr key={c.id} className="relative">
                    <td>
                      <Link href={`/admin/coupons/${c.id}`} className="font-mono font-semibold text-ink after:absolute after:inset-0 hover:text-gold-deep">
                        {c.code}
                      </Link>
                      {c.description ? <p className="text-xs text-ink-muted">{c.description}</p> : null}
                    </td>
                    <td>
                      {c.type === "PERCENT" ? `${c.value}% off` : c.type === "FLAT" ? `${money(c.value)} off` : "Free shipping"}
                      <p className="text-xs text-ink-muted">
                        {[c.minSubtotal ? `min ${money(c.minSubtotal)}` : null, c.maxDiscount ? `max ${money(c.maxDiscount)}` : null, c.firstOrderOnly ? "first order" : null].filter(Boolean).join(" · ")}
                      </p>
                    </td>
                    <td className="whitespace-nowrap text-xs text-ink-muted">{c.startsAt || c.endsAt ? `${c.startsAt ? fmtDate(c.startsAt) : "now"} → ${c.endsAt ? fmtDate(c.endsAt) : "no end"}` : "Always"}</td>
                    <td className="text-end tabular-nums">
                      {c.usedCount}
                      {c.usageLimit != null ? <span className="text-ink-muted"> / {c.usageLimit}</span> : null}
                    </td>
                    <td className="text-end tabular-nums">{stats?._sum.total ? money(stats._sum.total) : "—"}</td>
                    <td>
                      <StatusBadge status={status === "Live" ? "ACTIVE" : status === "Scheduled" ? "PENDING" : "ARCHIVED"} label={status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        ) : (
          <EmptyState title="No coupons yet" action={<ALink href="/admin/coupons/new" variant="primary">Create a coupon</ALink>} />
        )}
      </Card>
    </>
  );
}
