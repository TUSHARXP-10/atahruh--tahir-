import { notFound } from "next/navigation";
import { JournalEditor, type JournalDraft } from "@/components/admin/journal-editor";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/server/admin/auth";

export const metadata = { title: "Article" };

const day = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);

export default async function JournalEditPage({ params }: PageProps<"/admin/journal/[id]">) {
  const { id } = await params;
  await requireAdminPage(`/admin/journal/${id}`);
  let draft: JournalDraft = {
    title: "",
    titleAr: "",
    slug: "",
    excerpt: "",
    excerptAr: "",
    body: "",
    bodyAr: "",
    coverUrl: "",
    author: "Aayat al-Ruh Atelier",
    tags: [],
    published: false,
    publishedAt: day(new Date()),
  };
  if (id !== "new") {
    const p = await db.journalPost.findUnique({ where: { id } });
    if (!p) notFound();
    draft = {
      id: p.id,
      title: p.title,
      titleAr: p.titleAr ?? "",
      slug: p.slug,
      excerpt: p.excerpt,
      excerptAr: p.excerptAr ?? "",
      body: p.body,
      bodyAr: p.bodyAr ?? "",
      coverUrl: p.coverUrl,
      author: p.author,
      tags: p.tags,
      published: p.published,
      publishedAt: day(p.publishedAt),
    };
  }
  return (
    <>
      <PageHeader back={{ href: "/admin/journal", label: "Journal" }} title={draft.id ? "Edit article" : "New article"} />
      <JournalEditor key={draft.id ?? "new"} initial={draft} />
    </>
  );
}
