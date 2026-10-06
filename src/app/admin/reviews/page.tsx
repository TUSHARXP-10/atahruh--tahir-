import Link from "next/link";
import { ReviewList } from "@/components/admin/review-list";
import { Card, EmptyState, Notice, PageHeader, Pagination } from "@/components/admin/ui";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { requireAdminPage } from "@/server/admin/auth";
import { PAGE_SIZE } from "@/server/admin/constants";
import { first, pageOf } from "@/server/admin/queries";

export const metadata = { title: "Reviews" };

const TABS = [
  { key: "PENDING", label: "Waiting" },
  { key: "APPROVED", label: "Published" },
  { key: "REJECTED", label: "Hidden" },
  { key: "all", label: "All" },
] as const;

export default async function ReviewsPage({ searchParams }: PageProps<"/admin/reviews">) {
  await requireAdminPage("/admin/reviews");
  const sp = await searchParams;
  const tab = TABS.find((t) => t.key === first(sp.tab))?.key ?? "PENDING";
  const page = pageOf(sp.page);
  const where: Prisma.ReviewWhereInput = tab === "all" ? {} : { status: tab };

  const [rows, total, counts, demo] = await Promise.all([
    db.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { product: { select: { id: true, name: true, slug: true } } },
    }),
    db.review.count({ where }),
    db.review.groupBy({ by: ["status"], _count: { _all: true } }),
    db.review.count({ where: { isPlaceholder: true } }),
  ]);
  const count = (k: string) => (k === "all" ? counts.reduce((n, c) => n + c._count._all, 0) : (counts.find((c) => c.status === k)?._count._all ?? 0));

  return (
    <>
      <PageHeader title="Reviews" description="New reviews wait here until you publish them. Published reviews show on product pages with their star rating." />
      {demo ? (
        <div className="mb-4">
          <Notice tone="warn">
            {demo} reviews are demo content (marked “Demo”). They are never shown on the live site — remove them from the{" "}
            <Link href="/admin/launch" className="font-semibold underline">
              launch checklist
            </Link>{" "}
            once real reviews arrive.
          </Notice>
        </div>
      ) : null}
      <div className="no-scrollbar mb-4 flex gap-1 overflow-x-auto border-b border-[#e9dfcc]">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/reviews?tab=${t.key}`}
            className={cn("-mb-px flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm", tab === t.key ? "border-ink font-semibold text-ink" : "border-transparent text-ink-muted hover:text-ink")}
          >
            {t.label}
            <span className={cn("rounded-full px-1.5 text-[0.68rem]", t.key === "PENDING" && count(t.key) ? "bg-gold text-ink" : "bg-[#efe7d8] text-ink-muted")}>{count(t.key)}</span>
          </Link>
        ))}
      </div>
      <Card padded={false}>
        {rows.length ? (
          <>
            <ReviewList
              key={rows.map((r) => r.id + r.status + r.verified).join()}
              rows={rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))}
            />
            <Pagination page={page} pages={Math.ceil(total / PAGE_SIZE)} href={(p) => `/admin/reviews?tab=${tab}&page=${p}`} />
          </>
        ) : (
          <EmptyState title={tab === "PENDING" ? "No reviews waiting" : "No reviews here"} text={tab === "PENDING" ? "You’re all caught up." : undefined} />
        )}
      </Card>
    </>
  );
}
