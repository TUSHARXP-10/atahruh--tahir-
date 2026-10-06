import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FORMS, GENDERS, KINDS } from "@/components/admin/labels";
import { ALink, Card, PageHeader, Table } from "@/components/admin/ui";
import { db } from "@/lib/db";
import type { CatalogFilter } from "@/lib/types";
import { requireAdminPage } from "@/server/admin/auth";

export const metadata = { title: "Collections" };

function describe(f: CatalogFilter) {
  const parts: string[] = [];
  const names = (v: unknown, map: Record<string, string>) => (Array.isArray(v) ? v : [v]).map((x) => map[String(x)] ?? String(x).toLowerCase()).join(" or ");
  if (f.kind) parts.push(names(f.kind, KINDS));
  if (f.form) parts.push(`sold as ${names(f.form, FORMS)}`);
  if (f.gender?.length) parts.push(names(f.gender, GENDERS).toLowerCase());
  if (f.family?.length) parts.push(`${f.family.length} famil${f.family.length === 1 ? "y" : "ies"}`);
  if (f.isNew) parts.push("new arrivals");
  if (f.isBestseller) parts.push("bestsellers");
  if (f.onSale) parts.push("on offer");
  return parts.join(" · ") || "rule";
}

export default async function CollectionsPage() {
  await requireAdminPage("/admin/collections");
  const rows = await db.collection.findMany({ orderBy: { position: "asc" }, include: { _count: { select: { products: true } } } });
  return (
    <>
      <PageHeader
        title="Collections"
        description="Groups of products shown in menus and on the homepage — automatic (by rules) or hand-picked."
        actions={
          <ALink href="/admin/collections/new" variant="primary">
            <Plus /> New collection
          </ALink>
        }
      />
      <Card padded={false}>
        <Table>
          <thead>
            <tr>
              <th>Collection</th>
              <th>Products</th>
              <th>Homepage</th>
              <th className="text-end">Order</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="relative">
                <td>
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-md bg-[#f3ecdf]">{c.imageUrl ? <Image src={c.imageUrl} alt="" fill sizes="40px" className="object-cover" /> : null}</div>
                    <div>
                      <Link href={`/admin/collections/${c.id}`} className="font-medium text-ink after:absolute after:inset-0 hover:text-gold-deep">
                        {c.name}
                      </Link>
                      <p className="text-xs text-ink-muted">/collections/{c.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="text-ink-muted">{c.filter ? <span>Automatic: {describe(c.filter as CatalogFilter)}</span> : `${c._count.products} hand-picked`}</td>
                <td>{c.isFeatured ? <span className="rounded-full bg-gold/25 px-2 py-0.5 text-xs font-semibold text-ink">Featured</span> : <span className="text-ink-muted">—</span>}</td>
                <td className="text-end tabular-nums text-ink-muted">{c.position}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
