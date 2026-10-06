"use client";

import { Check, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Accordion } from "radix-ui";
import { createContext, use, useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { usePathname, useRouter } from "@/i18n/navigation";
import { activeFilterCount, PRICE_RANGES, toQuery, type CatalogParams, type FacetKey } from "@/lib/catalog-params";
import { formatPrice } from "@/lib/money";
import type { CatalogSort } from "@/lib/types";
import { cn } from "@/lib/utils";

export type FacetGroup = { key: FacetKey; values: { value: string; count: number }[] };

type Ctx = { pending: boolean; params: CatalogParams; navigate: (next: Partial<CatalogParams>) => void };
const FilterCtx = createContext<Ctx | null>(null);
const useFilters = () => use(FilterCtx)!;

/** Holds the URL-driven filter state and the pending transition for the whole catalogue view. */
export function FilterProvider({ params, children }: { params: CatalogParams; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const navigate = (next: Partial<CatalogParams>) => {
    const merged = { ...params, limit: undefined, ...next } as CatalogParams;
    start(() => {
      router.replace({ pathname, query: toQuery(merged) }, { scroll: false });
    });
  };
  return <FilterCtx value={{ pending, params, navigate }}>{children}</FilterCtx>;
}

export function usePendingCatalog() {
  return useFilters().pending;
}

function useLabel() {
  const t = useTranslations();
  const locale = useLocale();
  return (key: FacetKey, value: string) => {
    switch (key) {
      case "form":
        return t(`forms.${value}`);
      case "family":
        return t(`families.${value}`);
      case "gender":
        return t(`genders.${value}`);
      case "mood":
        return t(`moods.${value}`);
      case "need":
        return t(`needs.${value}`);
      case "price": {
        const r = PRICE_RANGES.find((x) => x.key === value)!;
        if (!("min" in r)) return t("catalog.under", { price: formatPrice(r.max + 1, locale) });
        if (!("max" in r)) return t("catalog.above", { price: formatPrice(r.min - 1, locale) });
        return t("catalog.between", { min: formatPrice(r.min, locale), max: formatPrice(r.max, locale) });
      }
    }
  };
}

const TITLES: Record<FacetKey, string> = {
  form: "form",
  family: "family",
  gender: "gender",
  mood: "mood",
  need: "need",
  price: "price",
};

export function FilterPanel({ groups, className }: { groups: FacetGroup[]; className?: string }) {
  const t = useTranslations("catalog");
  const { params, navigate } = useFilters();
  const label = useLabel();

  const toggle = (key: FacetKey, value: string) => {
    if (key === "price") return navigate({ price: params.price === value ? null : value });
    const current = params[key];
    navigate({ [key]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value] });
  };

  const visible = groups.filter((g) => g.values.some((v) => v.count > 0) && g.values.length > 1);

  return (
    <Accordion.Root type="multiple" defaultValue={visible.map((g) => g.key)} className={cn("divide-y divide-hairline", className)}>
      {visible.map((g) => (
        <Accordion.Item key={g.key} value={g.key} className="py-1">
          <Accordion.Trigger className="group flex w-full items-center justify-between py-3 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-accent">
            {t(TITLES[g.key])}
            <ChevronDown className="size-3.5 transition-transform group-data-[state=open]:rotate-180" />
          </Accordion.Trigger>
          <Accordion.Content className="pb-3">
            <ul className="space-y-0.5">
              {g.values.map(({ value, count }) => {
                const checked = g.key === "price" ? params.price === value : (params[g.key] as string[]).includes(value);
                const disabled = count === 0 && !checked;
                return (
                  <li key={value}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      disabled={disabled}
                      onClick={() => toggle(g.key, value)}
                      className="group/opt flex w-full items-center gap-3 py-1.5 text-start text-sm text-fg-muted transition-colors hover:text-heading disabled:opacity-35"
                    >
                      <span
                        className={cn(
                          "grid size-4 shrink-0 place-items-center border transition-colors",
                          g.key === "price" ? "rounded-full" : "rounded-[3px]",
                          checked ? "border-accent bg-accent text-white" : "border-hairline group-hover/opt:border-accent",
                        )}
                      >
                        {checked ? <Check className="size-3" strokeWidth={3} /> : null}
                      </span>
                      <span className={cn("flex-1", checked && "font-medium text-heading")}>{label(g.key, value)}</span>
                      <span className="text-xs tabular-nums text-fg-muted">{count}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}

export function ActiveChips() {
  const t = useTranslations("catalog");
  const { params, navigate } = useFilters();
  const label = useLabel();
  const chips: { key: FacetKey; value: string }[] = [
    ...(["form", "family", "gender", "mood", "need"] as const).flatMap((k) => params[k].map((value) => ({ key: k as FacetKey, value }))),
    ...(params.price ? [{ key: "price" as FacetKey, value: params.price }] : []),
  ];
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button
          key={`${c.key}-${c.value}`}
          type="button"
          onClick={() =>
            c.key === "price"
              ? navigate({ price: null })
              : navigate({ [c.key]: (params[c.key as Exclude<FacetKey, "price">] as string[]).filter((v) => v !== c.value) })
          }
          className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-3 py-1 text-xs text-heading hover:border-accent"
        >
          {label(c.key, c.value)} <X className="size-3" />
        </button>
      ))}
      <button
        type="button"
        onClick={() => navigate({ form: [], family: [], gender: [], mood: [], need: [], price: null })}
        className="px-2 text-xs text-fg-muted underline-offset-4 hover:text-heading hover:underline"
      >
        {t("clearAll")}
      </button>
    </div>
  );
}

export function SortSelect() {
  const t = useTranslations("catalog");
  const { params, navigate } = useFilters();
  const options: { value: CatalogSort; label: string }[] = [
    { value: "featured", label: t("sortFeatured") },
    { value: "newest", label: t("sortNewest") },
    { value: "price-asc", label: t("sortPriceAsc") },
    { value: "price-desc", label: t("sortPriceDesc") },
    { value: "rating", label: t("sortRating") },
  ];
  return (
    <label className="relative inline-flex items-center gap-2 text-xs text-fg-muted">
      <span className="hidden sm:inline">{t("sort")}</span>
      <select
        aria-label={t("sort")}
        value={params.sort}
        onChange={(e) => navigate({ sort: e.target.value as CatalogSort })}
        className="h-10 appearance-none rounded-full border border-hairline bg-surface pe-9 ps-4 text-xs text-heading focus:border-accent focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute end-3 size-3.5 text-accent" />
    </label>
  );
}

export function MobileFilters({ groups, resultCount }: { groups: FacetGroup[]; resultCount: number }) {
  const t = useTranslations("catalog");
  const { params } = useFilters();
  const [open, setOpen] = useState(false);
  const count = activeFilterCount(params);
  return (
    <>
      <Button variant="line" size="sm" shape="pill" className="h-10 lg:hidden" onClick={() => setOpen(true)}>
        <SlidersHorizontal strokeWidth={1.5} />
        {t("filters")}
        {count ? <span className="grid size-5 place-items-center rounded-full bg-gold text-[0.6rem] text-ink">{count}</span> : null}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[85dvh]">
          <div className="border-b border-gold/10 px-6 py-5">
            <SheetTitle className="font-display text-2xl">{t("filters")}</SheetTitle>
          </div>
          <div className="flex-1 overflow-y-auto px-6" data-lenis-prevent>
            <FilterPanel groups={groups} />
          </div>
          <div className="border-t border-gold/10 p-4">
            <Button className="w-full" onClick={() => setOpen(false)}>
              {t("apply")} · {t("results", { count: resultCount })}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
