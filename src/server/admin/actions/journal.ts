"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdminAction } from "../auth";
import { refreshStorefront } from "../refresh";
import { done, fail, invalid, uniqueViolation, type ActionResult } from "../result";

const schema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(3, "Title is required").max(160),
  titleAr: z.string().trim().max(160).default(""),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Web address: lowercase letters, numbers and dashes only"),
  excerpt: z.string().trim().min(10, "Write a short summary (shown on cards)").max(400),
  excerptAr: z.string().trim().max(400).default(""),
  body: z.string().trim().min(20, "The article is empty").max(60_000),
  bodyAr: z.string().trim().max(60_000).default(""),
  coverUrl: z.string().trim().min(1, "Choose a cover photo").max(500),
  author: z.string().trim().min(2).max(80),
  tags: z.array(z.string().trim().min(1).max(30)).max(8).default([]),
  published: z.boolean(),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a publish date"),
});

export type JournalPayload = z.input<typeof schema>;

/** ~220 words a minute, at least one. */
const readMinutes = (text: string) => Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / 220));

export async function saveJournalPost(payload: JournalPayload): Promise<ActionResult> {
  await requireAdminAction();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return invalid(parsed.error);
  const p = parsed.data;
  const data = {
    title: p.title,
    titleAr: p.titleAr || null,
    slug: p.slug,
    excerpt: p.excerpt,
    excerptAr: p.excerptAr || null,
    body: p.body,
    bodyAr: p.bodyAr || null,
    coverUrl: p.coverUrl,
    author: p.author,
    tags: p.tags,
    readMinutes: readMinutes(p.body),
    published: p.published,
    publishedAt: new Date(`${p.publishedAt}T09:00:00+05:30`),
  };
  try {
    const row = p.id ? await db.journalPost.update({ where: { id: p.id }, data }) : await db.journalPost.create({ data });
    refreshStorefront("content");
    return done(p.published ? "Article saved and live" : "Draft saved", p.id ? undefined : { redirect: `/admin/journal/${row.id}` });
  } catch (e) {
    return uniqueViolation(e, "web address") ?? fail("Could not save the article.");
  }
}

export async function deleteJournalPost(id: string): Promise<ActionResult> {
  await requireAdminAction();
  await db.journalPost.delete({ where: { id: String(id) } });
  refreshStorefront("content");
  return done("Article deleted", { redirect: "/admin/journal" });
}
