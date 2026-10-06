import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { ContentEditor, type ContentBlockView } from "@/components/admin/content-editor";
import { PageHeader, buttonClass } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { requireAdminPage } from "@/server/admin/auth";
import { first } from "@/server/admin/queries";

export const metadata = { title: "Homepage" };

const SECTIONS: Record<string, { title: string; description: string }> = {
  hero: { title: "Hero", description: "The big first screen: headline, buttons and photos." },
  announcements: { title: "Announcement bar", description: "The rotating messages in the thin bar at the very top of every page." },
  stats: { title: "Our Story numbers", description: "The four figures in the Our Story band." },
  inspiration: { title: "Our inspiration", description: "The portrait of Yasinali Sayed and its words, in the Our Story band and on the Our Story page." },
  rituals: { title: "Rituals", description: "The five ritual cards with their steps and suggested products." },
  instagram: { title: "Instagram feed", description: "Photos in the “Follow our journey” carousel and your handle." },
};

export default async function HomepageAdminPage({ searchParams }: PageProps<"/admin/homepage">) {
  await requireAdminPage("/admin/homepage");
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
        title="Homepage"
        description="Edit the words and photos on the homepage. Product rows (bestsellers, collections, journal) update by themselves from Products, Collections and Journal."
        actions={
          <a href="/" target="_blank" rel="noreferrer" className={buttonClass("secondary")}>
            <ExternalLink /> View homepage
          </a>
        }
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Homepage sections">
          {keys.map((k) => (
            <Link
              key={k}
              href={`/admin/homepage?section=${k}`}
              className={cn("shrink-0 rounded-lg px-3 py-2 text-sm", k === active ? "bg-white font-semibold text-ink shadow-sm ring-1 ring-[#e9dfcc]" : "text-ink-muted hover:bg-white/60 hover:text-ink")}
            >
              {SECTIONS[k].title}
            </Link>
          ))}
        </nav>
        {block ? (
          <ContentEditor
            key={`${block.key}-${block.updatedAt.toISOString()}`}
            block={{ key: block.key, ...SECTIONS[block.key], data: block.data as ContentBlockView["data"], dataAr: (block.dataAr ?? null) as ContentBlockView["dataAr"] }}
            products={products}
          />
        ) : null}
      </div>
    </>
  );
}
