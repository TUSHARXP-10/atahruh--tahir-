"use server";

import { db } from "@/lib/db";
import { photo, photoKeys } from "@/lib/images";
import { requireAdminAction } from "../auth";
import { findImageUsage, mediaUrl } from "../media";
import { done, fail, type ActionResult } from "../result";

export type LibraryImage = { url: string; label: string; width?: number; height?: number; createdAt?: string; uploaded: boolean };

/** Uploaded photos (newest first) followed by the bundled stock library. */
export async function listMediaLibrary(): Promise<LibraryImage[]> {
  await requireAdminAction();
  const uploads = await db.media.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, filename: true, width: true, height: true, createdAt: true },
  });
  return [
    ...uploads.map((m) => ({ url: mediaUrl(m.id), label: m.filename, width: m.width, height: m.height, createdAt: m.createdAt.toISOString(), uploaded: true })),
    ...photoKeys.map((k) => ({ url: photo(k), label: k, uploaded: false })),
  ];
}

export async function deleteMedia(id: string): Promise<ActionResult> {
  await requireAdminAction();
  const usage = await findImageUsage(mediaUrl(id));
  if (usage.length) return fail(`Still in use — ${usage.slice(0, 3).join(", ")}. Replace it there first.`);
  await db.media.deleteMany({ where: { id } });
  return done("Photo deleted");
}
