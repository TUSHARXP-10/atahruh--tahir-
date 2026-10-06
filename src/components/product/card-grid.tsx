"use client";

import { cn } from "@/lib/utils";
import type { FormType, ProductCardData } from "@/lib/types";
import { ProductCard } from "./product-card";
import { useQuickView } from "./quick-view";

/** A simple grid of compact product cards (with quick view) for editorial pages. */
export function CardGrid({ products, preferForm, className }: { products: ProductCardData[]; preferForm?: FormType; className?: string }) {
  const quickView = useQuickView();
  return (
    <div className={cn("grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-4", className)}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} onQuickView={quickView.open} preferForm={preferForm} />
      ))}
    </div>
  );
}
