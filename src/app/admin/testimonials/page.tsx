import { Plus } from "lucide-react";
import Link from "next/link";
import { ALink, Card, EmptyState, Notice, PageHeader, Table } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/server/admin/auth";

export const metadata = { title: "Testimonials" };

export default async function TestimonialsPage() {
  await requireAdminPage("/admin/testimonials");
  const rows = await db.testimonial.findMany({ orderBy: { position: "asc" }, include: { product: { select: { name: true } } } });
  const demo = rows.filter((r) => r.isPlaceholder).length;
  return (
    <>
      <PageHeader
        title="Testimonials"
        description="Customer quotes in the “What our customers say” section of the homepage."
        actions={
          <ALink href="/admin/testimonials/new" variant="primary">
            <Plus /> New testimonial
          </ALink>
        }
      />
      {demo ? (
        <div className="mb-4">
          <Notice tone="warn">{demo} quotes are demo content. They are hidden on the live site; replace them with real customer words (with permission).</Notice>
        </div>
      ) : null}
      <Card padded={false}>
        {rows.length ? (
          <Table>
            <thead>
              <tr>
                <th>Quote</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Shown</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="relative">
                  <td className="max-w-md">
                    <Link href={`/admin/testimonials/${t.id}`} className="line-clamp-2 text-ink after:absolute after:inset-0 hover:text-gold-deep">
                      “{t.quote}”
                    </Link>
                    <span className="text-xs text-gold-deep">{"★".repeat(t.rating)}</span>
                  </td>
                  <td className="whitespace-nowrap">
                    {t.name}
                    {t.location ? <span className="text-xs text-ink-muted"> · {t.location}</span> : null}
                    {t.isPlaceholder ? <span className="ms-2 rounded-full bg-[#eeeae3] px-2 py-0.5 text-[0.68rem] font-semibold text-[#5d5348]">Demo</span> : null}
                  </td>
                  <td className="text-ink-muted">{t.product?.name ?? "—"}</td>
                  <td className="text-ink-muted">{t.active ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState title="No testimonials yet" />
        )}
      </Card>
    </>
  );
}
