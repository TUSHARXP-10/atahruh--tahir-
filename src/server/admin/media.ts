import "server-only";
import sharp, { type OutputInfo } from "sharp";
import { db } from "@/lib/db";

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "image/heic", "image/heif", "image/tiff"];

export function mediaUrl(id: string) {
  return `/media/${id}.webp`;
}

/**
 * Store an uploaded photo: auto-rotated, capped at 2000 px on the long edge,
 * metadata stripped and re-encoded as WebP (typically 150–400 KB).
 */
export async function saveUpload(file: File) {
  if (!ACCEPTED.includes(file.type)) throw new UploadError(`${file.name}: use a JPG, PNG, WebP or HEIC photo.`);
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError(`${file.name} is larger than 15 MB.`);

  let out: { data: Buffer; info: OutputInfo };
  try {
    out = await sharp(Buffer.from(await file.arrayBuffer()), { failOn: "error" })
      .rotate()
      .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 5 })
      .toBuffer({ resolveWithObject: true });
  } catch {
    throw new UploadError(`${file.name} could not be read as an image.`);
  }

  const media = await db.media.create({
    data: {
      filename: file.name.slice(0, 200),
      contentType: "image/webp",
      size: out.info.size,
      width: out.info.width,
      height: out.info.height,
      data: new Uint8Array(out.data),
    },
    select: { id: true, width: true, height: true },
  });
  return { id: media.id, url: mediaUrl(media.id), width: media.width, height: media.height };
}

export class UploadError extends Error {}

/** Where an image URL is still used (so deleting it doesn't leave holes on the site). */
export async function findImageUsage(url: string) {
  const like = `%${url}%`;
  const [products, collections, posts, blocks] = await Promise.all([
    db.productImage.findMany({ where: { url }, select: { form: { select: { product: { select: { name: true } } } } }, take: 5 }),
    db.collection.findMany({ where: { imageUrl: url }, select: { name: true }, take: 5 }),
    db.journalPost.findMany({ where: { coverUrl: url }, select: { title: true }, take: 5 }),
    db.$queryRaw<{ key: string }[]>`SELECT key FROM "ContentBlock" WHERE data::text LIKE ${like} OR "dataAr"::text LIKE ${like}`,
  ]);
  return [
    ...products.map((p) => `Product: ${p.form.product.name}`),
    ...collections.map((c) => `Collection: ${c.name}`),
    ...posts.map((p) => `Journal: ${p.title}`),
    ...blocks.map((b) => `Homepage: ${b.key}`),
  ];
}
