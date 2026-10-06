"use client";

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import type { ProductCardData } from "@/lib/types";
import { getCardsBySlugs } from "@/server/actions/catalog";
import { ProductCarousel } from "./product-carousel";

export function ProductRail({ eyebrow, title, products }: { eyebrow?: string; title: string; products: ProductCardData[] }) {
  if (!products.length) return null;
  return (
    <section className="py-16 lg:py-20">
      <Container>
        <ProductCarousel
          products={products}
          header={(arrows) => (
            <div className="mb-10 flex items-end justify-between gap-6">
              <SectionHeading eyebrow={eyebrow} title={title} />
              <div className="hidden sm:block">{arrows}</div>
            </div>
          )}
        />
      </Container>
    </section>
  );
}

/** Products the visitor looked at recently (stored locally, excluding the current one). */
export function RecentlyViewed({ title, exclude }: { title: string; exclude?: string }) {
  const locale = useLocale();
  const [products, setProducts] = useState<ProductCardData[]>([]);

  useEffect(() => {
    let slugs: string[] = [];
    try {
      slugs = JSON.parse(localStorage.getItem("aar-recently-viewed") ?? "[]");
    } catch {}
    slugs = slugs.filter((s) => s !== exclude).slice(0, 10);
    if (!slugs.length) return;
    getCardsBySlugs(slugs, locale).then(setProducts).catch(() => {});
  }, [exclude, locale]);

  return <ProductRail title={title} products={products} />;
}
