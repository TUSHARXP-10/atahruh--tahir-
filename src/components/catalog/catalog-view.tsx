import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { KhatamStar, Ornament } from "@/components/brand/ornament";
import { ArchOutline, GirihPattern } from "@/components/brand/patterns";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";
import { FACETS, paramsToFilter, PRICE_RANGES, type CatalogParams, type FacetKey } from "@/lib/catalog-params";
import type { FormType, ProductCardData } from "@/lib/types";
import { filterCards, sortCards } from "@/server/queries/catalog";
import { ActiveChips, FilterPanel, FilterProvider, MobileFilters, SortSelect, type FacetGroup } from "./filters";
import { ProductGrid } from "./product-grid";

/** Facet counts reflect every *other* active filter (standard faceted search). */
function buildFacets(scope: ProductCardData[], params: CatalogParams): FacetGroup[] {
  const keys: Exclude<FacetKey, "price">[] = ["form", "family", "gender", "mood", "need"];
  const groups: FacetGroup[] = keys.map((key) => {
    const without = paramsToFilter({ ...params, [key]: [] });
    const base = filterCards(scope, without);
    return {
      key,
      values: (FACETS[key] as readonly string[])
        .map((value) => ({ value, count: filterCards(base, { ...paramsToFilter({ ...params, [key]: [value] }) }).length }))
        .filter((v) => v.count > 0 || (params[key] as string[]).includes(v.value)),
    };
  });
  const withoutPrice = filterCards(scope, paramsToFilter({ ...params, price: null }));
  groups.push({
    key: "price",
    values: PRICE_RANGES.map((r) => ({
      value: r.key,
      count: withoutPrice.filter((c) => ("min" in r ? c.minPrice >= r.min : true) && ("max" in r ? c.minPrice <= r.max : true)).length,
    })),
  });
  return groups;
}

export async function CatalogView({
  scope,
  params,
  title,
  subtitle,
  description,
  image,
  eyebrow,
  breadcrumb,
  preferForm,
  curated,
}: {
  scope: ProductCardData[];
  params: CatalogParams;
  title: string;
  subtitle?: string;
  description?: string;
  image?: string | null;
  eyebrow?: string;
  breadcrumb: { label: string; href?: string }[];
  preferForm?: FormType;
  /** Keep the curated order when sorting by "featured" */
  curated?: boolean;
}) {
  const t = await getTranslations("catalog");
  const filtered = filterCards(scope, paramsToFilter(params));
  const sorted = curated && params.sort === "featured" ? filtered : sortCards(filtered, params.sort);
  const visible = sorted.slice(0, params.limit);
  const groups = buildFacets(scope, params);

  return (
    <FilterProvider params={params}>
      {/* Editorial header */}
      <section className="relative overflow-hidden border-b border-gold/10">
        <GirihPattern opacity={0.04} />
        <Container className="relative grid items-center gap-8 py-12 grid-cols-1 lg:grid-cols-12 lg:py-16">
          <div className="lg:col-span-7">
            <Breadcrumbs items={breadcrumb} />
            <div className="mb-4 mt-8 flex items-center gap-3">
              <Ornament className="w-8" />
              <span className="eyebrow">{eyebrow ?? subtitle}</span>
            </div>
            <h1 className="text-display-lg text-ivory">{title}</h1>
            {description ? <p className="mt-5 max-w-xl text-smoke">{description}</p> : null}
          </div>
          {image ? (
            <div className="relative ms-auto hidden h-64 w-48 lg:col-span-4 lg:col-start-9 lg:block xl:h-72 xl:w-56">
              <div className="arch-pointed relative h-full w-full">
                <Image src={image} alt="" fill loading="eager" sizes="14rem" className="object-cover" />
              </div>
              <ArchOutline className="-inset-3 h-[calc(100%+1.5rem)] w-[calc(100%+1.5rem)] text-gold/50" />
            </div>
          ) : null}
        </Container>
      </section>

      <Section tone="light">
      <Container className="py-10 lg:py-14">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-6">
          <div className="flex items-center gap-3">
            <MobileFilters groups={groups} resultCount={filtered.length} />
            <h2 className="font-sans text-sm text-fg-muted">{t("results", { count: filtered.length })}</h2>
          </div>
          <SortSelect />
        </div>

        <div className="grid gap-10 grid-cols-1 lg:grid-cols-[15rem_1fr] xl:grid-cols-[16rem_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <p className="mb-2 font-display text-2xl text-heading">{t("filters")}</p>
              <FilterPanel groups={groups} />
            </div>
          </aside>
          <div className="min-w-0">
            <div className="mb-6">
              <ActiveChips />
            </div>
            {visible.length ? (
              <ProductGrid products={visible} total={sorted.length} params={params} preferForm={preferForm} />
            ) : (
              <div className="grid place-items-center rounded-lg border border-dashed border-hairline py-24 text-center">
                <KhatamStar className="mb-6 size-8 text-accent" filled={false} />
                <p className="font-display text-2xl text-heading">{t("empty")}</p>
                <Button asChild variant="line" shape="pill" className="mt-6">
                  <Link href={breadcrumb.at(-1)?.href ?? "/shop"}>{t("emptyCta")}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </Container>
      </Section>
    </FilterProvider>
  );
}
