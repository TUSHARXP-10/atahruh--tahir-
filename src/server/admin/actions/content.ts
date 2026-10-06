"use server";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireAdminAction } from "../auth";
import { refreshStorefront } from "../refresh";
import { done, fail, type ActionResult } from "../result";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

/**
 * The edited block must keep the structure the storefront expects: the same
 * object keys and value types, with array items shaped like the original items.
 */
function sameShape(original: Json, edited: Json, path = "block"): string | null {
  if (Array.isArray(original)) {
    if (!Array.isArray(edited)) return `${path} must be a list`;
    if (edited.length > 60) return `${path} has too many items`;
    const template = original[0];
    if (template === undefined) return null;
    for (const [i, item] of edited.entries()) {
      const err = sameShape(template, item, `${path} ${i + 1}`);
      if (err) return err;
    }
    return null;
  }
  if (original && typeof original === "object") {
    if (!edited || typeof edited !== "object" || Array.isArray(edited)) return `${path} is malformed`;
    for (const key of Object.keys(original)) {
      if (!(key in edited)) return `${path}: “${key}” is missing`;
      const err = sameShape(original[key], (edited as Record<string, Json>)[key], key);
      if (err) return err;
    }
    for (const key of Object.keys(edited)) if (!(key in original)) return `${path}: unexpected “${key}”`;
    return null;
  }
  if (original === null) return null;
  if (typeof edited !== typeof original) return `${path} has the wrong type`;
  if (typeof edited === "string" && edited.length > 2000) return `${path} is too long`;
  return null;
}

/** Arabic overrides: same tree, only strings (or null to fall back to English). */
function validOverride(node: unknown, depth = 0): boolean {
  if (depth > 8) return false;
  if (node === null || typeof node === "string") return typeof node !== "string" || node.length <= 2000;
  if (Array.isArray(node)) return node.length <= 60 && node.every((n) => validOverride(n, depth + 1));
  if (typeof node === "object") return Object.values(node as object).every((n) => validOverride(n, depth + 1));
  return false;
}

export async function saveContentBlock(key: string, data: Json, dataAr: Json | null): Promise<ActionResult> {
  await requireAdminAction();
  const block = await db.contentBlock.findUnique({ where: { key: String(key) } });
  if (!block) return fail("Unknown section");
  if (JSON.stringify(data).length > 100_000 || JSON.stringify(dataAr ?? null).length > 100_000) return fail("This section is too large");

  const err = sameShape(block.data as Json, data);
  if (err) return fail(`Could not save — ${err}`);
  if (dataAr !== null && !validOverride(dataAr)) return fail("Could not save the Arabic text");

  await db.contentBlock.update({
    where: { key: block.key },
    data: { data: data as Prisma.InputJsonValue, dataAr: dataAr === null ? Prisma.DbNull : (dataAr as Prisma.InputJsonValue) },
  });
  refreshStorefront("content");
  return done("Homepage updated");
}
