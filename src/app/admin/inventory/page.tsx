import Link from "next/link";
import { InventoryTable } from "@/components/admin/inventory-table";
import { FORMS } from "@/components/admin/labels";
import { Card, EmptyState, PageHeader, TextInput, buttonClass } from "@/components/admin/ui";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { requireAdminPage } from "@/server/admin/auth";
import { LOW_STOCK } from "@/server/admin/constants";
import { first } from "@/server/admin/queries";

export const metadata = { title: "Inventory" };

const VIEWS = [
  { key: "low", label: `Low (≤ ${LOW_STOCK})` },
  { key: "out", label: "Out of stock" },
  { key: "waiting", label: "Customers waiting" },
  { key: "all", label: "All sizes" },
] as const;

export default async function InventoryPage({ searchParams }: PageProps<"/admin/inventory">) {
  await requireAdminPage("/admin/inventory");
  const sp = await searchParams;
  const view = VIEWS.find((v) => v.key === first(sp.view))?.key ?? "low";
  const q = first(sp.q)?.trim() ?? "";

  const where: Prisma.VariantWhereInput = {
    form: { product: { status: { not: "ARCHIVED" }, ...(q ? { name: { contains: q, mode: "insensitive" } } : {}) } },
    ...(view === "low" ? { stock: { lte: LOW_STOCK } } : view === "out" ? { stock: 0 } : view === "waiting" ? { stockAlerts: { some: { notifiedAt: null } } } : {}),
  };
  const variants = await db.variant.findMany({
    where,
    orderBy: [{ stock: "asc" }, { sku: "asc" }],
    take: 500,
    include: {
      form: { select: { type: true, product: { select: { id: true, name: true } } } },
      _count: { select: { stockAlerts: { where: { notifiedAt: null } } } },
    },
  });

  return (
    <>
      <PageHeader title="Inventory" description="Update stock for every size in one place. Restocking a sold-out size emails the customers who asked to be told." />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-lg bg-[#efe7d8] p-1">
          {VIEWS.map((v) => (
            <Link
              key={v.key}
              href={`/admin/inventory?view=${v.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={cn("rounded-md px-3 py-1.5 text-sm", view === v.key ? "bg-white font-semibold text-ink shadow-sm" : "text-ink-muted hover:text-ink")}
            >
              {v.label}
            </Link>
          ))}
        </div>
        <form className="flex w-full gap-2 sm:w-auto" action="/admin/inventory">
          <input type="hidden" name="view" value={view} />
          <TextInput name="q" defaultValue={q} placeholder="Product name" className="min-w-0 flex-1 sm:w-56 sm:flex-none" aria-label="Search inventory" />
          <button className={buttonClass("secondary")}>Search</button>
        </form>
      </div>
      <Card padded={false}>
        {variants.length ? (
          <InventoryTable
            key={variants.map((v) => `${v.id}:${v.stock}`).join()}
            low={LOW_STOCK}
            rows={variants.map((v) => ({
              id: v.id,
              productId: v.form.product.id,
              product: v.form.product.name,
              form: FORMS[v.form.type],
              label: v.label,
              sku: v.sku,
              price: v.price,
              stock: v.stock,
              waiting: v._count.stockAlerts,
            }))}
          />
        ) : (
          <EmptyState title={view === "low" ? "Nothing is running low" : view === "out" ? "Nothing is sold out" : view === "waiting" ? "No one is waiting" : "No sizes found"} text="Switch to “All sizes” to edit any stock level." />
        )}
      </Card>
    </>
  );
}
