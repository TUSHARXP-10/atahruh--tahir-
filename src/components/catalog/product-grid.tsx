"use client";

import { useTranslations } from "next-intl";
import { ProductCard } from "@/components/product/product-card";
import { useQuickView } from "@/components/product/quick-view";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/i18n/navigation";
import { PAGE_SIZE, toQuery, type CatalogParams } from "@/lib/catalog-params";
import type { FormType, ProductCardData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { usePendingCatalog } from "./filters";

export function ProductGrid({
  products,
  total,
  params,
  preferForm,
}: {
  products: ProductCardData[];
  total: number;
  params: CatalogParams;
  preferForm?: FormType;
}) {
  const t = useTranslations("catalog");
  const pending = usePendingCatalog();
  const quickView = useQuickView();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div>
      <div
        className={cn(
          "grid grid-cols-2 gap-4 transition-opacity duration-300 sm:gap-5 md:grid-cols-3 xl:grid-cols-4",
          pending && "pointer-events-none opacity-50",
        )}
      >
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} priority={i < 3} onQuickView={quickView.open} preferForm={preferForm ?? (params.form[0] as FormType | undefined)} />
        ))}
      </div>
      {products.length < total ? (
        <div className="mt-14 flex flex-col items-center gap-3">
          <p className="text-xs text-fg-muted">
            {products.length} / {total}
          </p>
          <div className="h-px w-48 overflow-hidden bg-hairline">
            <div className="h-full bg-accent" style={{ width: `${(products.length / total) * 100}%` }} />
          </div>
          <Button
            variant="line"
            shape="pill"
            className="mt-3 px-8"
            onClick={() => router.replace({ pathname, query: toQuery({ ...params, limit: params.limit + PAGE_SIZE }) }, { scroll: false })}
          >
            {t("loadMore")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
