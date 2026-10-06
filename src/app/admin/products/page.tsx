import { Plus, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { money } from "@/components/admin/format";
import { FORMS, KINDS } from "@/components/admin/labels";
import { ALink, Card, EmptyState, PageHeader, Select, StatusBadge, Table, TextInput, buttonClass } from "@/components/admin/ui";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { requireAdminPage } from "@/server/admin/auth";
import { LOW_STOCK } from "@/server/admin/constants";
import { first } from "@/server/admin/queries";

export const metadata = { title: "Products" };

export default async function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  await requireAdminPage("/admin/products");
  const sp = await searchParams;
  const q = first(sp.q)?.trim() ?? "";
  const kind = first(sp.kind) ?? "";
  const status = first(sp.status) ?? "";

  const where: Prisma.ProductWhereInput = {
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { nameAr: { contains: q } }, { slug: { contains: q.toLowerCase() } }, { forms: { some: { variants: { some: { sku: { contains: q.toUpperCase() } } } } } }] } : {}),
    ...(kind in KINDS ? { kind: kind as keyof typeof KINDS } : {}),
    ...(["ACTIVE", "DRAFT", "ARCHIVED"].includes(status) ? { status: status as "ACTIVE" } : {}),
  };
  const products = await db.product.findMany({
    where,
    orderBy: [{ status: "asc" }, { position: "asc" }, { name: "asc" }],
    include: {
      forms: {
        orderBy: { position: "asc" },
        include: { images: { orderBy: { position: "asc" }, take: 1 }, variants: { select: { price: true, stock: true } } },
      },
    },
  });

  return (
    <>
      <PageHeader
        title="Products"
        description="Every fragrance, therapy oil and gift set. Each product can be sold as a Perfume, an Attar, or both."
        actions={
          <ALink href="/admin/products/new" variant="primary">
            <Plus /> New product
          </ALink>
        }
      />

      <form className="mb-4 flex flex-wrap gap-2" action="/admin/products">
        <div className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
          <TextInput name="q" defaultValue={q} placeholder="Search by name or SKU" className="ps-9" aria-label="Search products" />
        </div>
        <Select name="kind" defaultValue={kind} className="w-44" aria-label="Type">
          <option value="">All types</option>
          {Object.entries(KINDS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
        <Select name="status" defaultValue={status} className="w-40" aria-label="Status">
          <option value="">Any status</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </Select>
        <button className={buttonClass("primary")}>Filter</button>
      </form>

      <Card padded={false}>
        {products.length ? (
          <Table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Type</th>
                <th>Forms</th>
                <th className="text-end">Price</th>
                <th className="text-end">Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const img = p.forms.find((f) => f.images[0])?.images[0]?.url;
                const variants = p.forms.flatMap((f) => f.variants);
                const prices = variants.map((v) => v.price);
                const stock = variants.reduce((n, v) => n + v.stock, 0);
                const low = variants.some((v) => v.stock <= LOW_STOCK);
                return (
                  <tr key={p.id} className="relative">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="relative size-11 shrink-0 overflow-hidden rounded-md" style={{ backgroundColor: p.accentColor }}>
                          {img ? <Image src={img} alt="" fill sizes="44px" className="object-cover" /> : null}
                        </div>
                        <div>
                          <Link href={`/admin/products/${p.id}`} className="font-medium text-ink after:absolute after:inset-0 hover:text-gold-deep">
                            {p.name}
                          </Link>
                          <p className="text-xs text-ink-muted">
                            {[p.nameAr ? <bdi key="ar" dir="rtl" lang="ar">{p.nameAr}</bdi> : null, ...[p.isBestseller && "Bestseller", p.isNew && "New", p.isFeatured && "Featured"].filter(Boolean)]
                              .filter(Boolean)
                              .map((x, i) => (
                                <span key={i}>
                                  {i ? " · " : ""}
                                  {x}
                                </span>
                              ))}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-ink-muted">{KINDS[p.kind]}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {p.forms.map((f) => (
                          <span key={f.id} className="rounded-full bg-[#f3ecdf] px-2 py-0.5 text-[0.68rem] text-ink">
                            {FORMS[f.type]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="whitespace-nowrap text-end tabular-nums">
                      {prices.length ? (Math.min(...prices) === Math.max(...prices) ? money(prices[0]) : `${money(Math.min(...prices))} – ${money(Math.max(...prices))}`) : "—"}
                    </td>
                    <td className={cn("text-end tabular-nums", low ? "font-semibold text-ruby" : "text-ink")}>{stock}</td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        ) : (
          <EmptyState title="No products found" text="Try a different search, or add your first product." action={<ALink href="/admin/products/new" variant="primary">New product</ALink>} />
        )}
      </Card>
      <p className="mt-3 text-xs text-ink-muted">{products.length} product{products.length === 1 ? "" : "s"} · red stock means at least one size has {LOW_STOCK} or fewer left</p>
    </>
  );
}
