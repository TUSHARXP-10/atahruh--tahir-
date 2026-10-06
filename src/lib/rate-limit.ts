import "server-only";
import { headers } from "next/headers";
import { db } from "./db";

/** Best-effort client IP from proxy headers. */
export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim();
}

/**
 * Fixed-window rate limit stored in Postgres (works on serverless without Redis).
 * Returns true when the request is allowed.
 */
export async function rateLimit(bucket: string, limit: number, windowSeconds: number, id?: string) {
  const key = `${bucket}:${id ?? (await clientIp())}`;
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSeconds * 1000);
  const row = await db.rateLimit.findUnique({ where: { key } });
  if (!row || row.resetAt < now) {
    await db.rateLimit.upsert({ where: { key }, create: { key, count: 1, resetAt }, update: { count: 1, resetAt } });
    return true;
  }
  if (row.count >= limit) return false;
  await db.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
  return true;
}
