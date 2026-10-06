import { notFound } from "next/navigation";
import { ProductEditor } from "@/components/admin/product-editor";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/server/admin/auth";
import { loadEditorOptions, loadProductDraft } from "@/server/admin/product-draft";

export async function generateMetadata({ params }: PageProps<"/admin/products/[id]">) {
  const p = await db.product.findUnique({ where: { id: (await params).id }, select: { name: true } });
  return { title: p?.name ?? "Product" };
}

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  await requireAdminPage(`/admin/products/${id}`);
  const [draft, options, stamp] = await Promise.all([
    loadProductDraft(id),
    loadEditorOptions(),
    db.product.findUnique({ where: { id }, select: { updatedAt: true } }),
  ]);
  if (!draft) notFound();

  return (
    <>
      <PageHeader back={{ href: "/admin/products", label: "Products" }} title="Edit product" />
      {/* Re-mount after each save so new sizes pick up their database ids */}
      <ProductEditor key={stamp?.updatedAt.toISOString()} initial={draft} {...options} />
    </>
  );
}
