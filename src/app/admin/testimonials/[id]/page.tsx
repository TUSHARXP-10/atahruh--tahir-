import { notFound } from "next/navigation";
import { TestimonialForm, type TestimonialDraft } from "@/components/admin/testimonial-form";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/server/admin/auth";

export const metadata = { title: "Testimonial" };

export default async function TestimonialPage({ params }: PageProps<"/admin/testimonials/[id]">) {
  const { id } = await params;
  await requireAdminPage(`/admin/testimonials/${id}`);
  const products = await db.product.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" }, select: { id: true, name: true } });
  let draft: TestimonialDraft = { name: "", location: "", quote: "", quoteAr: "", rating: 5, productId: "", position: 0, active: true, isPlaceholder: false };
  if (id !== "new") {
    const t = await db.testimonial.findUnique({ where: { id } });
    if (!t) notFound();
    draft = { id: t.id, name: t.name, location: t.location ?? "", quote: t.quote, quoteAr: t.quoteAr ?? "", rating: t.rating, productId: t.productId ?? "", position: t.position, active: t.active, isPlaceholder: t.isPlaceholder };
  }
  return (
    <>
      <PageHeader back={{ href: "/admin/testimonials", label: "Testimonials" }} title={draft.id ? "Edit testimonial" : "New testimonial"} />
      <TestimonialForm initial={draft} products={products} />
    </>
  );
}
