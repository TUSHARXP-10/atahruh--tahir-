import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { ContentEditor, type ContentBlockView } from "@/components/admin/content-editor";
import { Notice, PageHeader, buttonClass } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { requireAdminPage } from "@/server/admin/auth";
import { first } from "@/server/admin/queries";

export const metadata = { title: "FAQ & policies" };

const SECTIONS: Record<string, { title: string; description: string; href: string }> = {
  faq: { title: "FAQ", description: "Questions and answers on the FAQ page, grouped by topic.", href: "/faq" },
  "policy-shipping": { title: "Shipping policy", description: "Delivery times, charges and cash on delivery.", href: "/policies/shipping" },
  "policy-returns": { title: "Returns & refunds", description: "What can be returned and how refunds work.", href: "/policies/returns" },
  "policy-privacy": { title: "Privacy policy", description: "How customer data is collected and used.", href: "/policies/privacy" },
  "policy-terms": { title: "Terms & conditions", description: "The terms of using the website and buying.", href: "/policies/terms" },
};

export default async function PagesAdminPage({ searchParams }: PageProps<"/admin/pages">) {
  await requireAdminPage("/admin/pages");
  const sp = await searchParams;
  const [blocks, products] = await Promise.all([
    db.contentBlock.findMany(),
    db.product.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" }, select: { slug: true, name: true } }),
  ]);
  const keys = Object.keys(SECTIONS).filter((k) => blocks.some((b) => b.key === k));
  const active = keys.includes(first(sp.section) ?? "") ? first(sp.section)! : keys[0];
  const block = blocks.find((b) => b.key === active);

  return (
    <>
      <PageHeader
        title="FAQ & policies"
        description="Edit the FAQ and the legal pages. Page text uses Markdown: ## for a heading, **bold**, - for a list."
        actions={
          block ? (
            <a href={SECTIONS[block.key].href} target="_blank" rel="noreferrer" className={buttonClass("secondary")}>
              <ExternalLink /> View page
            </a>
          ) : null
        }
      />
      <div className="mb-6 grid gap-3">
        <Notice>
          Words in curly braces fill in automatically from Settings — {"{freeShippingThreshold}"}, {"{standardShippingFee}"}, {"{expressShippingFee}"}, {"{codFee}"}, {"{codMaxOrder}"}, {"{giftWrapFee}"}, {"{freeSampleThreshold}"}, {"{email}"}, {"{phone}"} — so prices and contact details always stay current.
        </Notice>
        <Notice tone="warn">The policies are a careful starting point written for an Indian fragrance brand. Have them reviewed by your lawyer or CA before launch.</Notice>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Pages">
          {keys.map((k) => (
            <Link
              key={k}
              href={`/admin/pages?section=${k}`}
              className={cn("shrink-0 rounded-lg px-3 py-2 text-sm", k === active ? "bg-white font-semibold text-ink shadow-sm ring-1 ring-[#e9dfcc]" : "text-ink-muted hover:bg-white/60 hover:text-ink")}
            >
              {SECTIONS[k].title}
            </Link>
          ))}
        </nav>
        {block ? (
          <ContentEditor
            key={`${block.key}-${block.updatedAt.toISOString()}`}
            block={{ key: block.key, title: SECTIONS[block.key].title, description: SECTIONS[block.key].description, data: block.data as ContentBlockView["data"], dataAr: (block.dataAr ?? null) as ContentBlockView["dataAr"] }}
            products={products}
          />
        ) : null}
      </div>
    </>
  );
}
