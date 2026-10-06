"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdminAction } from "../auth";
import { refreshStorefront } from "../refresh";
import { done, fail, type ActionResult } from "../result";

const ids = z.array(z.string().min(1)).min(1).max(200);

export async function setReviewStatus(reviewIds: string[], status: "APPROVED" | "REJECTED" | "PENDING"): Promise<ActionResult> {
  await requireAdminAction();
  const parsed = ids.safeParse(reviewIds);
  const s = z.enum(["APPROVED", "REJECTED", "PENDING"]).safeParse(status);
  if (!parsed.success || !s.success) return fail("Nothing to update");
  const res = await db.review.updateMany({ where: { id: { in: parsed.data } }, data: { status: s.data } });
  refreshStorefront("reviews", "catalog");
  return done(`${res.count} review${res.count === 1 ? "" : "s"} ${s.data === "APPROVED" ? "published" : s.data === "REJECTED" ? "hidden" : "moved back to pending"}`);
}

export async function setReviewVerified(id: string, verified: boolean): Promise<ActionResult> {
  await requireAdminAction();
  await db.review.update({ where: { id: String(id) }, data: { verified: !!verified } });
  refreshStorefront("reviews", "catalog");
  return done(verified ? "Marked as verified buyer" : "Verified badge removed");
}

export async function deleteReviews(reviewIds: string[]): Promise<ActionResult> {
  await requireAdminAction();
  const parsed = ids.safeParse(reviewIds);
  if (!parsed.success) return fail("Nothing to delete");
  const res = await db.review.deleteMany({ where: { id: { in: parsed.data } } });
  refreshStorefront("reviews", "catalog");
  return done(`${res.count} review${res.count === 1 ? "" : "s"} deleted`);
}
