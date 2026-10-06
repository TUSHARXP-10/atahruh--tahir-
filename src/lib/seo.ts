import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { site } from "@/lib/site";

/** "/shop" → "/shop" in English, "/ar/shop" in Arabic ("/" stays the home page). */
export function localePath(locale: string, path: string) {
  const clean = path === "/" ? "" : path;
  return locale === routing.defaultLocale ? clean || "/" : `/${locale}${clean}`;
}

/** Absolute address on the live site, for structured data and share links. */
export function absoluteUrl(path: string) {
  return new URL(path, `${site.url}/`).toString();
}

const ogLocale = (locale: string) => (locale === "ar" ? "ar_AE" : "en_IN");

/** Trims long copy to a search-snippet length on a word boundary. */
export function metaDescription(text: string, max = 158) {
  const flat = text.replace(/[#*_>`[\]]/g, "").replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:·—–-]+$/, "")}…`;
}

type PageMetaInput = {
  locale: string;
  /** Path without the locale prefix, e.g. "/shop" */
  path: string;
  title: string;
  description?: string;
  /** Share images; defaults to the branded site card */
  images?: (string | { url: string; width?: number; height?: number; alt?: string })[];
  /** Use the title as is, without the "· Aayat al-Ruh" suffix */
  absoluteTitle?: boolean;
  article?: { publishedTime?: string; modifiedTime?: string; tags?: string[] };
};

/**
 * Full metadata for a public page. Next.js merges metadata shallowly, so every page
 * sets its own canonical, language alternates and share card here rather than
 * inheriting the layout's (which would point every page at the home page).
 */
export function pageMetadata({ locale, path, title, description, images, absoluteTitle, article }: PageMetaInput): Metadata {
  const url = localePath(locale, path);
  const ogImages = images?.length ? images : [{ url: "/og/site", width: 1200, height: 630, alt: site.name }];
  const shareTitle = absoluteTitle ? title : `${title} · ${locale === "ar" ? site.nameAr : site.name}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(routing.locales.map((l) => [l, localePath(l, path)])),
        "x-default": localePath(routing.defaultLocale, path),
      },
    },
    openGraph: {
      ...(article ? { type: "article" as const, ...article } : { type: "website" as const }),
      url,
      siteName: site.name,
      locale: ogLocale(locale),
      alternateLocale: routing.locales.filter((l) => l !== locale).map(ogLocale),
      title: shareTitle,
      description,
      images: ogImages,
    },
    twitter: { card: "summary_large_image", title: shareTitle, description, images: ogImages },
  };
}
