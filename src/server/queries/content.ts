import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { showDemoContent } from "@/lib/demo";
import { commerceDefaults, site } from "@/lib/site";
import { tr } from "@/lib/utils";
import { CACHE_SECONDS, CONTENT_TAG } from "./catalog";

/** Deep-merge Arabic overrides onto the English block (arrays merge by index). */
function mergeLocalized(base: unknown, override: unknown): unknown {
  if (override === undefined || override === null) return base;
  if (Array.isArray(base)) {
    if (!Array.isArray(override)) return base;
    return base.map((item, i) => mergeLocalized(item, override[i]));
  }
  if (base && typeof base === "object") {
    if (typeof override !== "object") return base;
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const [k, v] of Object.entries(override as Record<string, unknown>)) {
      out[k] = k in out ? mergeLocalized(out[k], v) : v;
    }
    return out;
  }
  return override;
}

const getBlocks = unstable_cache(async () => db.contentBlock.findMany(), ["content-blocks"], {
  tags: [CONTENT_TAG],
  revalidate: CACHE_SECONDS,
});

export async function getContent<T>(key: string, locale: string): Promise<T | null> {
  const blocks = await getBlocks();
  const block = blocks.find((b) => b.key === key);
  if (!block) return null;
  const data = locale === "ar" ? mergeLocalized(block.data, block.dataAr) : block.data;
  const typed = data as T & { isPlaceholder?: boolean };
  if (typed && typed.isPlaceholder && !showDemoContent()) return null;
  return typed;
}

// ─── testimonials ───────────────────────────────────────────────────────────

const getTestimonialRows = unstable_cache(
  async () =>
    db.testimonial.findMany({
      where: { active: true },
      orderBy: { position: "asc" },
      include: { product: { select: { slug: true, name: true, nameAr: true } } },
    }),
  ["testimonials"],
  { tags: [CONTENT_TAG], revalidate: CACHE_SECONDS },
);

export async function getTestimonials(locale: string) {
  const rows = await getTestimonialRows();
  return rows
    .filter((t) => showDemoContent() || !t.isPlaceholder)
    .map((t) => ({
      id: t.id,
      name: t.name,
      location: t.location,
      rating: t.rating,
      quote: tr(locale, t.quote, t.quoteAr),
      product: t.product ? { slug: t.product.slug, name: tr(locale, t.product.name, t.product.nameAr) } : null,
    }));
}

// ─── journal ────────────────────────────────────────────────────────────────

const getPostRows = unstable_cache(
  async () =>
    db.journalPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
    }),
  ["journal-posts"],
  { tags: [CONTENT_TAG], revalidate: CACHE_SECONDS },
);

function localizePost(p: Awaited<ReturnType<typeof getPostRows>>[number], locale: string) {
  return {
    slug: p.slug,
    title: tr(locale, p.title, p.titleAr),
    excerpt: tr(locale, p.excerpt, p.excerptAr),
    body: tr(locale, p.body, p.bodyAr),
    /** "en" when an Arabic visitor is shown the English body */
    bodyLocale: locale === "ar" && !p.bodyAr ? "en" : locale,
    coverUrl: p.coverUrl,
    author: p.author,
    tags: p.tags,
    readMinutes: p.readMinutes,
    publishedAt: new Date(p.publishedAt).toISOString(),
  };
}

/** Published posts whose publish date has arrived (future dates are scheduled). */
async function livePosts() {
  const now = Date.now();
  return (await getPostRows()).filter((p) => new Date(p.publishedAt).getTime() <= now);
}

export async function getJournalPosts(locale: string, limit?: number) {
  const rows = await livePosts();
  return rows.slice(0, limit ?? rows.length).map((p) => localizePost(p, locale));
}

export async function getJournalPost(slug: string, locale: string) {
  const rows = await livePosts();
  const row = rows.find((p) => p.slug === slug);
  return row ? localizePost(row, locale) : null;
}

// ─── settings ───────────────────────────────────────────────────────────────

const getSettingRows = unstable_cache(async () => db.setting.findMany(), ["settings"], {
  tags: [CONTENT_TAG],
  revalidate: CACHE_SECONDS,
});

export async function getSettings() {
  const rows = await getSettingRows();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, unknown>;
  return {
    commerce: { ...commerceDefaults, ...((map.commerce as object) ?? {}) } as typeof commerceDefaults,
    contact: { ...site.contact, ...((map.contact as object) ?? {}) } as typeof site.contact,
    socials: { ...site.socials, ...((map.socials as object) ?? {}) } as typeof site.socials,
    business: { ...site.business, ...((map.business as object) ?? {}) } as Record<keyof typeof site.business, string>,
  };
}

// ─── block shapes ───────────────────────────────────────────────────────────

export type HeroBlock = {
  eyebrow: string;
  title: string;
  titleAccent: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  image: string;
  imageSecondary: string;
  background: string;
};

export type StatsBlock = { items: { value: string; label: string }[] };
export type InspirationBlock = { eyebrow: string; name: string; caption: string; text: string; image: string };
export type InstagramBlock = { handle: string; tiles: string[] };
export type AnnouncementsBlock = { items: string[] };
export type RitualsBlock = {
  items: {
    key: string;
    title: string;
    notes: string;
    time: string;
    image: string;
    description: string;
    steps: string[];
    products: string[];
  }[];
};

// ─── pages (FAQ & policies, edited in Admin → FAQ & policies) ──────────────

export type FaqBlock = { title: string; intro: string; items: { topic: string; q: string; a: string }[] };
export type PolicyBlock = { title: string; intro: string; body: string };

export const POLICY_SLUGS = ["shipping", "returns", "privacy", "terms"] as const;
export type PolicySlug = (typeof POLICY_SLUGS)[number];

export async function getPolicy(slug: PolicySlug, locale: string) {
  const blocks = await getBlocks();
  const block = blocks.find((b) => b.key === `policy-${slug}`);
  if (!block) return null;
  const data = (locale === "ar" ? mergeLocalized(block.data, block.dataAr) : block.data) as PolicyBlock;
  const arBody = (block.dataAr as Partial<PolicyBlock> | null)?.body;
  return {
    ...data,
    /** Arabic visitors see the English body when no Arabic translation exists */
    bodyLocale: locale === "ar" && !arBody ? "en" : locale,
    updatedAt: new Date(block.updatedAt).toISOString(),
  };
}

export async function getPolicyTitles(locale: string) {
  const blocks = await getBlocks();
  return POLICY_SLUGS.map((slug) => {
    const block = blocks.find((b) => b.key === `policy-${slug}`);
    const data = block ? ((locale === "ar" ? mergeLocalized(block.data, block.dataAr) : block.data) as PolicyBlock) : null;
    return { slug, title: data?.title ?? slug };
  });
}
