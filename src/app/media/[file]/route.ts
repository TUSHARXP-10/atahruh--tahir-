import { db } from "@/lib/db";

/** Serves admin-uploaded photos: /media/<id>.webp. Ids never change, so responses cache forever. */
export async function GET(_req: Request, ctx: RouteContext<"/media/[file]">) {
  const { file } = await ctx.params;
  const id = file.replace(/\.webp$/, "");
  if (!/^[a-z0-9]{20,40}$/.test(id)) return new Response("Not found", { status: 404 });

  const media = await db.media.findUnique({ where: { id }, select: { data: true, contentType: true } });
  if (!media) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(media.data), {
    headers: {
      "Content-Type": media.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
