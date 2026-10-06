import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { fmtDate } from "@/components/admin/format";
import { ALink, Card, EmptyState, PageHeader, StatusBadge, Table } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/server/admin/auth";

export const metadata = { title: "Journal" };

export default async function JournalAdminPage() {
  await requireAdminPage("/admin/journal");
  const posts = await db.journalPost.findMany({ orderBy: { publishedAt: "desc" } });
  return (
    <>
      <PageHeader
        title="Journal"
        description="Stories, guides and rituals — they appear on the homepage and the Journal page, and help customers find you on Google."
        actions={
          <ALink href="/admin/journal/new" variant="primary">
            <Plus /> New article
          </ALink>
        }
      />
      <Card padded={false}>
        {posts.length ? (
          <Table>
            <thead>
              <tr>
                <th>Article</th>
                <th>Tags</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="relative">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-md bg-[#f3ecdf]">
                        <Image src={p.coverUrl} alt="" fill sizes="64px" className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <Link href={`/admin/journal/${p.id}`} className="font-medium text-ink after:absolute after:inset-0 hover:text-gold-deep">
                          {p.title}
                        </Link>
                        <p className="text-xs text-ink-muted">
                          {p.readMinutes} min read{p.titleAr ? " · Arabic ✓" : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="text-xs text-ink-muted">{p.tags.join(", ") || "—"}</td>
                  <td className="whitespace-nowrap text-ink-muted">{fmtDate(p.publishedAt)}</td>
                  <td>
                    <StatusBadge status={p.published ? "ACTIVE" : "DRAFT"} label={p.published ? (p.publishedAt > new Date() ? "Scheduled" : "Published") : "Draft"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState title="No articles yet" action={<ALink href="/admin/journal/new" variant="primary">Write the first article</ALink>} />
        )}
      </Card>
    </>
  );
}
