import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { db } from "@/lib/db";
import { absoluteUrl, localePath } from "@/lib/seo";
import { POLICY_SLUGS } from "@/server/queries/content";

/** Rebuilt hourly so new products and articles appear without a redeploy. */
export const revalidate = 3600;

type Entry = { priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly"; lastModified?: Date; images?: string[] };

/**
 * Every public page in English (/) and Arabic (/ar), linked as language alternates,
 * with product and article photos for image search. Dates are only given where they
 * are real — search engines stop trusting a sitemap whose dates are always "now".
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, collections, posts] = await Promise.all([
    db.product.findMany({
      where: { status: "ACTIVE", kind: { not: "DISCOVERY_SET" } },
      select: { slug: true, updatedAt: true, forms: { select: { images: { select: { url: true }, orderBy: { position: "asc" }, take: 3 } } } },
    }),
    db.collection.findMany({ select: { slug: true } }),
    db.journalPost.findMany({ where: { published: true, publishedAt: { lte: new Date() } }, select: { slug: true, updatedAt: true, coverUrl: true } }),
  ]);

  const catalogUpdated = products.reduce<Date | undefined>((latest, p) => (!latest || p.updatedAt > latest ? p.updatedAt : latest), undefined);
  const journalUpdated = posts.reduce<Date | undefined>((latest, p) => (!latest || p.updatedAt > latest ? p.updatedAt : latest), undefined);

  // One entry per language, each listing all languages as alternates
  const entry = (path: string, opts: Entry): MetadataRoute.Sitemap => {
    const languages = {
      ...Object.fromEntries(routing.locales.map((l) => [l, absoluteUrl(localePath(l, path))])),
      "x-default": absoluteUrl(localePath(routing.defaultLocale, path)),
    };
    return routing.locales.map((locale) => ({
      url: absoluteUrl(localePath(locale, path)),
      ...(opts.lastModified ? { lastModified: opts.lastModified } : {}),
      changeFrequency: opts.changeFrequency,
      priority: locale === routing.defaultLocale ? opts.priority : Math.round(opts.priority * 9) / 10,
      alternates: { languages },
      ...(opts.images?.length ? { images: opts.images } : {}),
    }));
  };

  return [
    ...entry("/", { priority: 1, changeFrequency: "daily", lastModified: catalogUpdated }),
    ...entry("/shop", { priority: 0.9, changeFrequency: "daily", lastModified: catalogUpdated }),
    ...collections.flatMap((c) => entry(`/collections/${c.slug}`, { priority: 0.8, changeFrequency: "weekly", lastModified: catalogUpdated })),
    ...products.flatMap((p) =>
      entry(`/products/${p.slug}`, {
        priority: 0.8,
        changeFrequency: "weekly",
        lastModified: p.updatedAt,
        images: [...new Set(p.forms.flatMap((f) => f.images.map((i) => absoluteUrl(i.url))))].slice(0, 6),
      }),
    ),
    ...["/therapies", "/gifting", "/discovery-set", "/fragrance-quiz", "/rituals", "/our-story"].flatMap((p) => entry(p, { priority: 0.7, changeFrequency: "weekly" })),
    // The Concierge page is only useful when the assistant is switched on
    ...(process.env.ANTHROPIC_API_KEY ? entry("/concierge", { priority: 0.5, changeFrequency: "monthly" }) : []),
    ...entry("/journal", { priority: 0.7, changeFrequency: "weekly", lastModified: journalUpdated }),
    ...posts.flatMap((p) => entry(`/journal/${p.slug}`, { priority: 0.6, changeFrequency: "monthly", lastModified: p.updatedAt, images: [absoluteUrl(p.coverUrl)] })),
    ...["/faq", "/contact", "/track-order", ...POLICY_SLUGS.map((s) => `/policies/${s}`)].flatMap((p) => entry(p, { priority: 0.3, changeFrequency: "monthly" })),
  ];
}
