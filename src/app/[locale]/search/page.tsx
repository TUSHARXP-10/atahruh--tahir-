import Fuse from "fuse.js";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CatalogView } from "@/components/catalog/catalog-view";
import { parseCatalogParams } from "@/lib/catalog-params";
import { db } from "@/lib/db";
import { filterCards, getAllCards } from "@/server/queries/catalog";

export const metadata: Metadata = { robots: { index: false, follow: true } };

export default async function SearchPage({ params, searchParams }: PageProps<"/[locale]/search">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 80);
  const [cards, t, tn, notes] = await Promise.all([
    getAllCards(locale),
    getTranslations("search"),
    getTranslations("nav"),
    db.product.findMany({ select: { id: true, name: true, nameAr: true, notes: { select: { note: { select: { name: true, nameAr: true } } } } } }),
  ]);

  const extra = new Map(notes.map((p) => [p.id, { alt: `${p.name} ${p.nameAr ?? ""}`, notes: p.notes.map((n) => `${n.note.name} ${n.note.nameAr ?? ""}`).join(" ") }]));
  const pool = filterCards(cards, {}).map((c) => ({ ...c, alt: extra.get(c.id)?.alt ?? "", noteText: extra.get(c.id)?.notes ?? "" }));
  const results = q
    ? new Fuse(pool, {
        keys: [
          { name: "name", weight: 3 },
          { name: "alt", weight: 2 },
          { name: "noteText", weight: 1.5 },
          { name: "family", weight: 1 },
          { name: "tagline", weight: 0.8 },
        ],
        threshold: 0.38,
        ignoreLocation: true,
      })
        .search(q)
        .map((r) => r.item)
    : pool;

  return (
    <CatalogView
      scope={results}
      params={parseCatalogParams(sp)}
      title={q ? t("resultsFor", { query: q }) : t("title")}
      eyebrow={t("title")}
      description={q && !results.length ? t("noResults", { query: q }) : undefined}
      breadcrumb={[{ label: tn("home"), href: "/" }, { label: t("title") }]}
      curated={!!q}
    />
  );
}
