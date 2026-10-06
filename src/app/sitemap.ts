import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { site } from "@/lib/site";
import { POLICY_SLUGS } from "@/server/queries/content";

/** Rebuilt hourly so new products and articles appear without a redeploy. */
export const revalidate = 3600;

/** Every public page in English (/) and Arabic (/ar), linked as language alternates. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, collections, posts] = await Promise.all([
    db.product.findMany({ where: { status: "ACTIVE", kind: { not: "DISCOVERY_SET" } }, select: { slug: true, updatedAt: true } }),
    db.collection.findMany({ select: { slug: true } }),
    db.journalPost.findMany({ where: { published: true, publishedAt: { lte: new Date() } }, select: { slug: true, updatedAt: true } }),
  ]);

  const entry = (path: string, opts: { priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly"; lastModified?: Date }) => {
    const en = `${site.url}${path === "/" ? "" : path}` || site.url;
    const ar = `${site.url}/ar${path === "/" ? "" : path}`;
    return { url: en, lastModified: opts.lastModified ?? new Date(), changeFrequency: opts.changeFrequency, priority: opts.priority, alternates: { languages: { en, ar } } };
  };

  return [
    entry("/", { priority: 1, changeFrequency: "daily" }),
    entry("/shop", { priority: 0.9, changeFrequency: "daily" }),
    ...["/therapies", "/gifting", "/discovery-set", "/fragrance-quiz", "/rituals", "/our-story", "/journal", "/concierge"].map((p) => entry(p, { priority: 0.7, changeFrequency: "weekly" })),
    ...["/faq", "/contact", "/track-order", ...POLICY_SLUGS.map((s) => `/policies/${s}`)].map((p) => entry(p, { priority: 0.3, changeFrequency: "monthly" })),
    ...collections.map((c) => entry(`/collections/${c.slug}`, { priority: 0.8, changeFrequency: "weekly" })),
    ...products.map((p) => entry(`/products/${p.slug}`, { priority: 0.8, changeFrequency: "weekly", lastModified: p.updatedAt })),
    ...posts.map((p) => entry(`/journal/${p.slug}`, { priority: 0.6, changeFrequency: "monthly", lastModified: p.updatedAt })),
  ];
}
