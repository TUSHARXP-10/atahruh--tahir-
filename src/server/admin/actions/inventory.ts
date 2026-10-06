"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdminAction } from "../auth";
import { refreshStorefront } from "../refresh";
import { done, invalid, type ActionResult } from "../result";
import { notifyBackInStock } from "../stock";

const schema = z.array(z.object({ id: z.string().min(1), stock: z.number().int().min(0).max(1_000_000) })).min(1).max(500);

/** Bulk stock update from the inventory screen. */
export async function updateStock(changes: { id: string; stock: number }[]): Promise<ActionResult> {
  await requireAdminAction();
  const parsed = schema.safeParse(changes);
  if (!parsed.success) return invalid(parsed.error);

  const before = await db.variant.findMany({ where: { id: { in: parsed.data.map((c) => c.id) } }, select: { id: true, stock: true } });
  await db.$transaction(parsed.data.map((c) => db.variant.update({ where: { id: c.id }, data: { stock: c.stock } })));
  const restocked = parsed.data.filter((c) => c.stock > 0 && before.find((b) => b.id === c.id)?.stock === 0).map((c) => c.id);

  refreshStorefront("catalog");
  const emailed = await notifyBackInStock(restocked);
  const n = parsed.data.length;
  return done(`${n} size${n === 1 ? "" : "s"} updated${emailed ? ` · ${emailed} waiting customer${emailed === 1 ? "" : "s"} emailed` : ""}`);
}
