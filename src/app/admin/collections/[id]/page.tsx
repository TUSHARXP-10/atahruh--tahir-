import { notFound } from "next/navigation";
import { CollectionEditor } from "@/components/admin/collection-editor";
import { PageHeader } from "@/components/admin/ui";
import { requireAdminPage } from "@/server/admin/auth";
import { emptyCollection, loadCollectionDraft, loadProductOptions } from "@/server/admin/collection-draft";

export const metadata = { title: "Collection" };

export default async function CollectionPage({ params }: PageProps<"/admin/collections/[id]">) {
  const { id } = await params;
  await requireAdminPage(`/admin/collections/${id}`);
  const [draft, products] = await Promise.all([id === "new" ? emptyCollection : loadCollectionDraft(id), loadProductOptions()]);
  if (!draft) notFound();
  return (
    <>
      <PageHeader back={{ href: "/admin/collections", label: "Collections" }} title={id === "new" ? "New collection" : "Edit collection"} />
      <CollectionEditor key={draft.id ?? "new"} initial={draft} products={products} />
    </>
  );
}
