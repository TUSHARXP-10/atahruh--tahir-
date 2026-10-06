import { MediaGrid, MediaUploader } from "@/components/admin/media-grid";
import { Card, EmptyState, PageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/server/admin/auth";
import { mediaUrl } from "@/server/admin/media";

export const metadata = { title: "Media library" };

export default async function MediaPage() {
  await requireAdminPage("/admin/media");
  const items = await db.media.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    select: { id: true, filename: true, width: true, height: true, size: true, createdAt: true },
  });
  return (
    <>
      <PageHeader
        title="Media library"
        description="Every photo you upload. They are resized and compressed automatically — upload the best quality you have (JPG, PNG, WebP or iPhone HEIC, up to 15 MB)."
        actions={<MediaUploader />}
      />
      {items.length ? (
        <MediaGrid items={items.map((m) => ({ ...m, url: mediaUrl(m.id), createdAt: m.createdAt.toISOString() }))} />
      ) : (
        <Card>
          <EmptyState title="No uploads yet" text="Upload product photos here or straight from a product, collection or article." />
        </Card>
      )}
    </>
  );
}
