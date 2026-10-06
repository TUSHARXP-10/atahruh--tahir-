import { ProductEditor } from "@/components/admin/product-editor";
import { newForm, type ProductDraft } from "@/components/admin/product-draft-shared";
import { PageHeader } from "@/components/admin/ui";
import { requireAdminPage } from "@/server/admin/auth";
import { loadEditorOptions } from "@/server/admin/product-draft";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireAdminPage("/admin/products/new");
  const options = await loadEditorOptions();
  const draft: ProductDraft = {
    name: "",
    nameAr: "",
    slug: "",
    kind: "FRAGRANCE",
    status: "DRAFT",
    tagline: "",
    taglineAr: "",
    story: "",
    storyAr: "",
    family: "",
    gender: "UNISEX",
    moods: [],
    therapyNeeds: [],
    seasons: [],
    times: [],
    occasions: [],
    longevity: 3,
    sillage: 3,
    intensity: 3,
    accentColor: "#C9A55C",
    bottleShape: "facet",
    isBestseller: false,
    isNew: true,
    isFeatured: false,
    isSampleable: true,
    useBottleArt: false,
    position: "100",
    seoTitle: "",
    seoDescription: "",
    notes: { top: [], heart: [], base: [] },
    collectionIds: [],
    pairIds: [],
    forms: [newForm("PERFUME", ""), newForm("ATTAR", "")],
  };
  return (
    <>
      <PageHeader back={{ href: "/admin/products", label: "Products" }} title="New product" description="Saved as a draft until you set it to Active. Add photos, sizes and prices for each form you sell." />
      <ProductEditor initial={draft} {...options} />
    </>
  );
}
