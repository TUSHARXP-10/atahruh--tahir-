import type { CatalogFilter, CatalogSort, FormType } from "./types";

export const PRICE_RANGES = [
  { key: "u1000", max: 99_999 },
  { key: "1000-2500", min: 100_000, max: 250_000 },
  { key: "2500-5000", min: 250_001, max: 500_000 },
  { key: "o5000", min: 500_001 },
] as const;

export const SORTS: CatalogSort[] = ["featured", "newest", "price-asc", "price-desc", "rating"];

export const FACETS = {
  form: ["PERFUME", "ATTAR", "OIL", "SET"],
  family: ["OUD", "FLORAL", "WOODY", "AMBER", "MUSK", "CITRUS", "FRESH", "SPICY", "GOURMAND", "EARTHY", "HERBAL"],
  gender: ["MEN", "WOMEN", "UNISEX"],
  mood: ["CALM", "ENERGETIC", "CONFIDENT", "FOCUSED", "ROMANTIC", "BALANCED"],
  need: ["STRESS", "SLEEP", "FOCUS", "SKIN_HAIR", "BALANCE"],
} as const;

export type FacetKey = keyof typeof FACETS | "price";

export type CatalogParams = {
  form: string[];
  family: string[];
  gender: string[];
  mood: string[];
  need: string[];
  price: string | null;
  sort: CatalogSort;
  limit: number;
};

export const PAGE_SIZE = 24;

type RawParams = Record<string, string | string[] | undefined>;

function list(raw: RawParams, key: keyof typeof FACETS) {
  const v = raw[key];
  const values = (Array.isArray(v) ? v.join(",") : (v ?? "")).split(",").map((s) => s.trim().toUpperCase());
  return values.filter((x) => (FACETS[key] as readonly string[]).includes(x));
}

export function parseCatalogParams(raw: RawParams): CatalogParams {
  const sort = SORTS.includes(raw.sort as CatalogSort) ? (raw.sort as CatalogSort) : "featured";
  const price = PRICE_RANGES.some((r) => r.key === raw.price) ? (raw.price as string) : null;
  const limit = Math.min(240, Math.max(PAGE_SIZE, Number(raw.limit) || PAGE_SIZE));
  return {
    form: list(raw, "form"),
    family: list(raw, "family"),
    gender: list(raw, "gender"),
    mood: list(raw, "mood"),
    need: list(raw, "need"),
    price,
    sort,
    limit,
  };
}

export function paramsToFilter(p: Pick<CatalogParams, "form" | "family" | "gender" | "mood" | "need" | "price">): CatalogFilter {
  const range = PRICE_RANGES.find((r) => r.key === p.price);
  return {
    form: p.form.length ? (p.form as FormType[]) : undefined,
    family: p.family.length ? p.family : undefined,
    gender: p.gender.length ? p.gender : undefined,
    mood: p.mood.length ? p.mood : undefined,
    need: p.need.length ? p.need : undefined,
    minPrice: range && "min" in range ? range.min : undefined,
    maxPrice: range && "max" in range ? range.max : undefined,
  };
}

/** Serialise params back to a query object (omits defaults). */
export function toQuery(p: Partial<CatalogParams>) {
  const q: Record<string, string> = {};
  for (const k of ["form", "family", "gender", "mood", "need"] as const) {
    const v = p[k];
    if (v && v.length) q[k] = v.join(",");
  }
  if (p.price) q.price = p.price;
  if (p.sort && p.sort !== "featured") q.sort = p.sort;
  if (p.limit && p.limit > PAGE_SIZE) q.limit = String(p.limit);
  return q;
}

export function activeFilterCount(p: CatalogParams) {
  return p.form.length + p.family.length + p.gender.length + p.mood.length + p.need.length + (p.price ? 1 : 0);
}
