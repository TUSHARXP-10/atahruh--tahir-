"use client";

import { Heart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product/product-card";
import { useQuickView } from "@/components/product/quick-view";
import { useStore } from "@/components/providers/store-provider";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { ProductCardData } from "@/lib/types";
import { getCardsByIds } from "@/server/actions/catalog";

export function WishlistView() {
  const t = useTranslations();
  const locale = useLocale();
  const { wishlist } = useStore();
  const quickView = useQuickView();
  const [loaded, setLoaded] = useState<ProductCardData[] | null>(null);
  const empty = !wishlist.length;

  useEffect(() => {
    if (empty) return;
    let alive = true;
    getCardsByIds(wishlist, locale)
      .then((p) => alive && setLoaded(p))
      .catch(() => alive && setLoaded([]));
    return () => {
      alive = false;
    };
  }, [wishlist, locale, empty]);
  const products = empty ? [] : loaded;

  if (products === null) {
    return <div className="grid grid-cols-2 gap-6 md:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-t-full bg-ebony" />)}</div>;
  }

  if (!products.length) {
    return (
      <div className="grid place-items-center rounded-sm border border-dashed border-gold/20 py-24 text-center">
        <Heart className="mb-6 size-10 text-gold/60" strokeWidth={1} />
        <p className="font-display text-3xl text-ivory">{t("account.wishlistEmpty")}</p>
        <p className="mt-2 text-smoke">{t("account.wishlistEmptyText")}</p>
        <Button asChild className="mt-8">
          <Link href="/collections/bestsellers">{t("cart.emptyCta")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} onQuickView={quickView.open} />
      ))}
    </div>
  );
}
